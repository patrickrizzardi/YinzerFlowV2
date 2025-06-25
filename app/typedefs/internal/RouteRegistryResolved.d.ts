import type { THttpMethod } from '@typedefs/constants/http.js';
import type { ContextImpl } from '@core/execution/ContextImpl.ts';

export interface RouteRegistryOptionsResolved {
  beforeHooks: Array<ResponseFunctionResolved | UndefinedResponseFunctionResolved>;
  afterHooks: Array<ResponseFunctionResolved>;
}

export interface RouteRegistryResolved {
  prefix?: string;
  path: string;
  method: THttpMethod;
  handler: ResponseFunctionResolved;
  options: RouteRegistryOptionsResolved;
}

/**
 * Pre-compiled route with regex pattern for efficient runtime matching
 *
 * We compile route patterns into regexes at registration time (server startup)
 * rather than at request time for performance reasons:
 * - Registration: O(1) one-time cost per route
 * - Runtime: O(1) for exact routes, O(n) for parameterized routes with pre-compiled regex
 *
 * Example: "/users/:id/posts/:postId" becomes:
 * - pattern: /^\/users\/([^\/]+)\/posts\/([^\/]+)$/
 * - paramNames: ["id", "postId"]
 */
export interface PreCompiledRouteResolved extends RouteRegistryResolved {
  pattern: RegExp;
  paramNames: Array<string>;
  isParameterized: boolean;
}

export interface RouteMatchResolved {
  route: RouteRegistryResolved;
  params: Record<string, string>;
}

/**
 * Represents a route handler function that returns a response body
 *
 * This type defines the signature for route handlers that process requests
 * and return a response. The function can return either a promise that resolves
 * to a response body or a response body directly.
 *
 * @param ctx - The request context containing request and response objects
 * @returns A response body or a promise that resolves to a response body
 */
export type ResponseFunctionResolved = (ctx: ContextImpl) => Promise<unknown> | unknown;

/**
 * Represents a route handler function that may or may not return a response body
 *
 * This type extends TResponseFunction to also allow handlers that don't return
 * anything (void). This is useful for hook functions that may modify the
 * request or response but don't need to return a response body themselves.
 *
 * @param ctx - The request context containing request and response objects
 * @returns A response body, a promise that resolves to a response body, void, or a promise that resolves to void
 */
export type UndefinedResponseFunctionResolved = ResponseFunctionResolved | ((ctx: ContextImpl) => Promise<void> | void);
