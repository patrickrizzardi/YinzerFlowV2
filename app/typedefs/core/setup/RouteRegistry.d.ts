import type { THttpMethod } from '@typedefs/constants/http.ts';
import type { TResponseFunction } from '@typedefs/core/Context.js';
import type { TAfterHookResponse, TBeforeHookResponse } from '@typedefs/core/setup/Setup.js';

export interface IRouteRegistry {
  register: (route: IRoute) => void;
  findRoute: (method: THttpMethod, path: string) => IRouteMatch | undefined;
}

export interface IRouteMatch {
  route: IRoute;
  params: Record<string, string>;
}

export interface IRoute {
  prefix?: string;
  path: string;
  method: THttpMethod;
  handler: TResponseFunction;
  options?:
    | {
        beforeHooks: Array<TBeforeHookResponse>;
        afterHooks: Array<TAfterHookResponse>;
      }
    | undefined;
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
export interface IPreCompiledRoute extends IRoute {
  pattern: RegExp;
  paramNames: Array<string>;
  isParameterized: boolean;
}