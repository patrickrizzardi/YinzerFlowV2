import type { THttpMethod } from '@typedefs/http.ts';
import type { TResponseFunction } from '@typedefs/core/Context.js';
import type { TAfterHookResponse, TBeforeHookResponse } from '@typedefs/core/Hook.js';

export interface IRouteRegistry {
  register: (route: IRoute) => void;
  findRoute: (method: THttpMethod, path: string) => IRoute | undefined;
}

export interface IRoute {
  prefix?: string;
  path: string;
  method: THttpMethod;
  handler: TResponseFunction;
  options?:
    | {
        beforeHooks?: Array<TBeforeHookResponse>;
        afterHooks?: Array<TAfterHookResponse>;
      }
    | undefined;
}
