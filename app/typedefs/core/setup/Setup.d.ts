import type { THttpMethod } from '@typedefs/constants/http.ts';
import type { TResponseFunction, TUndefinableResponseFunction } from '@typedefs/core/Context.js';
import type { IRoute } from '@typedefs/core/setup/RouteRegistry.js';

export type TSetupRouteRegistration = (path: string, handler: IRoute['handler'], options?: IRoute['options']) => void;
export type IGroup = Record<Lowercase<THttpMethod>, TSetupRouteRegistration>;

// ===== Hooks =====
export type TSetupHookRegistration = (handler: TAfterHookResponse | TBeforeHookResponse, options?: IHookOptions) => void;
export type TBeforeHookResponse = TResponseFunction | TUndefinableResponseFunction;
export type TAfterHookResponse = TResponseFunction;

export type IHookOptions = {
  routesToExclude?: Array<string>;
  rawBody?: boolean;
} & {
  routesToInclude?: Array<string>;
  rawBody?: boolean;
};

export interface IHookRegistry {
  beforeAll: Set<{
    handler: TBeforeHookResponse;
    options?: IHookOptions | undefined;
  }>;
  afterAll: Set<{
    handler: TAfterHookResponse;
    options?: IHookOptions | undefined;
  }>;
  onError: TResponseFunction;
}
