import type { THttpMethod } from 'typedefs/constants/http.ts';
import type { IHookOptions, TAfterHookResponse, TBeforeHookResponse } from 'typedefs/core/Hook.typedefs.ts';
import type { IRoute } from 'typedefs/core/Route.typedefs.ts';

export type TSetupRouteRegistration = (path: string, handler: IRoute['handler'], options?: IRoute['options']) => void;
export type IGroup = Record<Lowercase<THttpMethod>, TSetupRouteRegistration>;
export type TSetupHookRegistration = (handler: TAfterHookResponse | TBeforeHookResponse, options?: IHookOptions) => void;

export interface ISetup {
  /**
   * Route Registration
   */
  get: TSetupRouteRegistration;
  post: TSetupRouteRegistration;
  put: TSetupRouteRegistration;
  delete: TSetupRouteRegistration;
  patch: TSetupRouteRegistration;
  options: TSetupRouteRegistration;
  // head: (path: string, handler: TResponseFunction) => YinzerFlowServer;
  // trace: (path: string, handler: TResponseFunction) => YinzerFlowServer;
  group: (prefix: string, callback: (group: IGroup) => void, options?: IRoute['options']) => void;

  /**
   * Hook Registration
   *
   * Note these are going to be called dynamically at run time, for now
   * we are just storing them in the server object until runtime. Although
   * it is slower during lookup, it is more flexible and memory efficient
   * allowing for more flexibility to include hook modification, conditional
   * hook execution, and better debugging.
   */
  beforeAll: TSetupHookRegistration;
  afterAll: TSetupHookRegistration;
  onError: (handler: IRoute['handler']) => void;
}
