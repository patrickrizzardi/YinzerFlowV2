import type { THttpMethod } from 'typedefs/constants/http.ts';
import type { TResponseFunction } from 'typedefs/core/Context.typedefs.ts';
import type { TAfterHookResponse, TBeforeHookResponse } from 'typedefs/core/Hook.typedefs.ts';

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
