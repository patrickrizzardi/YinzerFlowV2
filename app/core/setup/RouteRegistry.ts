import { compileRoutePattern } from '@core/setup/utils/compileRoutePatter.ts';
import { normalizePath, normalizeRouteStructure } from '@core/setup/utils/normalizeStringPatterns.ts';
import { validateParameterNames } from '@core/setup/utils/validateParameterNames.ts';
import type { THttpMethod } from '@typedefs/constants/http.ts';
import type { PreCompiledRouteResolved, RouteMatchResolved, RouteRegistryResolved } from '@typedefs/internal/RouteRegistryResolved.ts';

/**
 * RouteRegistry: Efficient route storage and matching
 *
 * DESIGN DECISION: Parameter extraction happens here (not in RequestImpl) because:
 * 1. We already compile regexes for route matching - reusing them for param extraction is free
 * 2. Avoids duplicate regex compilation at request time (performance critical)
 * 3. Single source of truth for route patterns and their compiled forms
 *
 * PERFORMANCE STRATEGY:
 * - Exact routes (no params): O(1) Map lookup
 * - Parameterized routes: O(n) iteration with pre-compiled regex matching
 * - Most apps have few parameterized routes, so O(n) is acceptable
 *
 * EXAMPLES:
 * - "/users" (exact) → stored in exactRoutes Map for instant lookup
 * - "/users/:id" (parameterized) → compiled to regex, stored in parameterizedRoutes Array
 */
export class RouteRegistry {
  /**
   * Fast O(1) lookup for routes without parameters
   * Example: GET /users, POST /login, etc.
   */
  private readonly exactRoutes = new Map<THttpMethod, Map<string, RouteRegistryResolved>>();

  /**
   * Array of pre-compiled parameterized routes for O(n) matching
   * Example: GET /users/:id, POST /users/:id/posts/:postId, etc.
   *
   * We use an array because:
   * 1. Route patterns can't be used as Map keys (they're not exact matches)
   * 2. Most apps have relatively few parameterized routes
   * 3. Pre-compiled regexes make matching fast
   */
  private readonly parameterizedRoutes = new Map<THttpMethod, Array<PreCompiledRouteResolved>>();

  /**
   * @internal
   * Register a new route
   *
   * PERFORMANCE NOTE: This happens at server startup, so we can afford
   * more expensive operations like regex compilation here.
   */
  register({ method, path, handler, options }: RouteRegistryResolved): void {
    const normalizedPath = normalizePath(path);
    const isParameterized = normalizedPath.includes(':');

    // Validate route before registration
    if (isParameterized) {
      validateParameterNames(normalizedPath);
    }

    // Prevent duplicate route registration
    // We check for exact pattern duplicates, not request path matches
    if (this._hasExactRoutePattern(method, normalizedPath)) {
      throw new Error(`Route ${normalizedPath} already exists for method ${method}`);
    }

    const route = { method, path: normalizedPath, handler, options };

    if (isParameterized) {
      // Store in parameterized routes with pre-compiled regex
      this._storeParameterizedRoute(method, route);
    } else {
      // Store in exact routes for O(1) lookup
      this._storeExactRoute(method, normalizedPath, route);
    }
  }

  /**
   * @internal
   * Find a route and extract parameters from the request path
   *
   * RUNTIME PERFORMANCE: This is called for every HTTP request, so it must be fast!
   * 1. Try exact match first (O(1) - fastest case)
   * 2. Fall back to parameterized routes (O(n) with pre-compiled regex)
   *
   * @param method - HTTP method (GET, POST, etc.)
   * @param path - Request path (e.g., "/users/123/posts/456")
   * @returns Route match with extracted parameters, or undefined if no match
   */
  findRoute(method: THttpMethod, path: string): RouteMatchResolved | undefined {
    const normalizedPath = normalizePath(path);

    // FAST PATH: Try exact match first (most common case)
    const exactRoute = this.exactRoutes.get(method)?.get(normalizedPath);
    if (exactRoute) {
      return {
        route: exactRoute,
        params: {}, // No parameters to extract
      };
    }

    // PARAMETERIZED PATH: Check routes with parameters
    return this._findParameterizedRoute(method, normalizedPath);
  }

  /**
   * @internal
   * Check if a route pattern already exists (for conflict detection)
   * This is different from findRoute which matches request paths to patterns
   */
  private _hasExactRoutePattern(method: THttpMethod, pattern: string): boolean {
    // Check exact routes
    if (this.exactRoutes.get(method)?.has(pattern)) {
      return true;
    }

    // For parameterized routes, check if the structure conflicts
    // Example: /users/:id conflicts with /users/:userId (same structure, different param names)
    if (pattern.includes(':')) {
      const normalizedPattern = normalizeRouteStructure(pattern);
      const paramRoutes = this.parameterizedRoutes.get(method);

      if (paramRoutes) {
        return paramRoutes.some((route) => normalizeRouteStructure(route.path) === normalizedPattern);
      }
    } else {
      // Check parameterized routes for exact pattern match
      const paramRoutes = this.parameterizedRoutes.get(method);
      if (paramRoutes) {
        return paramRoutes.some((route) => route.path === pattern);
      }
    }

    return false;
  }

  /**
   * @internal
   * Store an exact route (no parameters) for O(1) lookup
   */
  private _storeExactRoute(method: THttpMethod, path: string, route: RouteRegistryResolved): void {
    if (!this.exactRoutes.has(method)) {
      this.exactRoutes.set(method, new Map());
    }

    this.exactRoutes.get(method)?.set(path, route);
  }

  /**
   * @internal
   * Store a parameterized route with pre-compiled regex pattern
   */
  private _storeParameterizedRoute(method: THttpMethod, route: RouteRegistryResolved): void {
    if (!this.parameterizedRoutes.has(method)) {
      this.parameterizedRoutes.set(method, []);
    }

    /**
     * Compile a route pattern into a regex with parameter extraction
     *
     * This is the magic that converts route patterns to regexes:
     * - "/users/:id" → /^\/users\/([^\/]+)$/
     * - "/users/:id/posts/:postId" → /^\/users\/([^\/]+)\/posts\/([^\/]+)$/
     *
     * WHY AT REGISTRATION TIME: Regex compilation is expensive, so we do it once
     * at server startup rather than on every request.
     */
    const compiled = compileRoutePattern(route);
    this.parameterizedRoutes.get(method)?.push(compiled);
  }

  /**
   * @internal
   * Find and match a parameterized route, extracting parameters
   */
  private _findParameterizedRoute(method: THttpMethod, path: string): RouteMatchResolved | undefined {
    const paramRoutes = this.parameterizedRoutes.get(method);
    if (!paramRoutes) return undefined;

    // Try each parameterized route until we find a match
    for (const compiledRoute of paramRoutes) {
      const match = path.match(compiledRoute.pattern);
      if (match) {
        const params: Record<string, string> = {};

        // Extract parameters from regex capture groups
        // match[0] is the full match, match[1+] are the captured groups
        for (let i = 0; i < compiledRoute.paramNames.length; i++) {
          const paramValue = match[i + 1];
          const paramName = compiledRoute.paramNames[i];

          if (paramValue !== undefined && paramName !== undefined) {
            params[paramName] = paramValue;
          }
        }

        return {
          route: compiledRoute,
          params,
        };
      }
    }

    return undefined;
  }
}
