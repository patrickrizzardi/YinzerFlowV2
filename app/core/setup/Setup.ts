import { httpMethod } from '@constants/http.ts';
import type { THttpMethod } from '@typedefs/constants/http.ts';
import { RouteRegistry } from '@core/setup/RouteRegistry.ts';
import type { IServerConfiguration } from '@typedefs/core/YinzerFlow.js';
import { handleCustomConfiguration } from '@core/setup/utils/handleCustomConfiguration.ts';
import type { Setup } from '@typedefs/public/Setup.js';
import type { ResponseFunctionResolved, RouteRegistryOptionsResolved, UndefinedResponseFunctionResolved } from '@typedefs/internal/RouteRegistryResolved.js';
import type { SetupMethodResolved } from '@typedefs/internal/SetupResolved.ts';
import { HookRegistry } from '@core/execution/HookRegistry.ts';
import type { GlobalHookOptionsResolved } from '@typedefs/internal/HookRegistry.js';

export class SetupImpl implements Setup {
  readonly _configuration: IServerConfiguration;
  readonly _routeRegistry = new RouteRegistry();
  readonly _hooks = new HookRegistry();

  constructor(customConfiguration?: IServerConfiguration) {
    this._configuration = handleCustomConfiguration(customConfiguration);
  }

  //   ===== Route Registration =====
  get(path: string, handler: ResponseFunctionResolved, options?: RouteRegistryOptionsResolved): void {
    this._routeRegistry.register({ method: httpMethod.get, handler, path, options: options ?? { beforeHooks: [], afterHooks: [] } });
  }

  post(path: string, handler: ResponseFunctionResolved, options?: RouteRegistryOptionsResolved): void {
    this._routeRegistry.register({ method: httpMethod.post, handler, path, options: options ?? { beforeHooks: [], afterHooks: [] } });
  }

  put(path: string, handler: ResponseFunctionResolved, options?: RouteRegistryOptionsResolved): void {
    this._routeRegistry.register({ method: httpMethod.put, handler, path, options: options ?? { beforeHooks: [], afterHooks: [] } });
  }

  patch(path: string, handler: ResponseFunctionResolved, options?: RouteRegistryOptionsResolved): void {
    this._routeRegistry.register({ method: httpMethod.patch, handler, path, options: options ?? { beforeHooks: [], afterHooks: [] } });
  }

  delete(path: string, handler: ResponseFunctionResolved, options?: RouteRegistryOptionsResolved): void {
    this._routeRegistry.register({ method: httpMethod.delete, handler, path, options: options ?? { beforeHooks: [], afterHooks: [] } });
  }

  options(path: string, handler: ResponseFunctionResolved, options?: RouteRegistryOptionsResolved): void {
    this._routeRegistry.register({ method: httpMethod.options, handler, path, options: options ?? { beforeHooks: [], afterHooks: [] } });
  }

  group(
    prefix: string,
    callback: (group: Record<Lowercase<THttpMethod>, SetupMethodResolved>) => void,
    options?: RouteRegistryOptionsResolved, // These follow the same pattern as the individual route registration methods
  ): void {
    const createRouteHandler =
      (method: THttpMethod) =>
      (path: string, handler: ResponseFunctionResolved, routeOptions?: RouteRegistryOptionsResolved): void => {
        const fullPath = `${prefix}${path}`;
        this._routeRegistry.register({
          method,
          handler,
          path: fullPath,
          options: {
            beforeHooks: [...(options?.beforeHooks ?? []), ...(routeOptions?.beforeHooks ?? [])],
            afterHooks: [...(routeOptions?.afterHooks ?? []), ...(options?.afterHooks ?? [])],
          },
        });
      };

    // Create a group app that registers routes with prefix and group hooks
    const group = {
      get: createRouteHandler(httpMethod.get),
      post: createRouteHandler(httpMethod.post),
      put: createRouteHandler(httpMethod.put),
      delete: createRouteHandler(httpMethod.delete),
      patch: createRouteHandler(httpMethod.patch),
      options: createRouteHandler(httpMethod.options),
    };

    // Execute callback to register routes
    callback(group);
  }

  /**
   * Hook Registration
   *
   * Note these are going to be called dynamically at run time, for now
   * we are just storing them in the server object until runtime. Although
   * it is slower during lookup, it is more flexible and memory efficient
   * allowing for more flexibility to include hook modification, conditional
   * hook execution, and better debugging.
   */
  beforeAll(handlers: Array<ResponseFunctionResolved | UndefinedResponseFunctionResolved>, options?: GlobalHookOptionsResolved): void {
    this._hooks._addBeforeHooks(handlers, options);
  }

  afterAll(handlers: Array<ResponseFunctionResolved>, options?: GlobalHookOptionsResolved): void {
    this._hooks._addAfterHooks(handlers, options);
  }

  onError(handler: ResponseFunctionResolved): void {
    this._hooks._addOnError(handler);
  }
}
