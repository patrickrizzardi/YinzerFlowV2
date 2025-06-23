import type { THttpMethod } from 'typedefs/constants/http.ts';
import type { IRoute, IRouteRegistry } from 'typedefs/core/Route.typedefs.ts';

export class RouteRegistry implements IRouteRegistry {
  private readonly routes = new Map<THttpMethod, Map<string, IRoute>>();

  register({ method, path, handler, options }: IRoute): void {
    const normalizedPath = normalizePath(path);

    // Create the route map if it doesn't exist
    if (!this.routes.has(method)) {
      this.routes.set(method, new Map());
    }

    // See if the route already exists
    const existingRoute = this.findRoute(method, normalizedPath);
    if (existingRoute) {
      throw new Error(`Route ${normalizedPath} already exists for method ${method}`);
    }

    // Create the route
    this.routes.get(method)?.set(normalizedPath, { method, path, handler, options });
  }

  findRoute(method: THttpMethod, path: string): IRoute | undefined {
    return this.routes.get(method)?.get(path);
  }
}

/**
 * Normalize the path to always start with a /
 *
 * @param path - The path to normalize
 * @returns The normalized path
 */
const normalizePath = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`; // Add leading slash if not present
  return normalizedPath.replace(/\/\/+/g, '/'); // Remove double slashes
};
