import { httpMethod } from '@constants/http.ts';
import type { THttpMethod } from '@typedefs/constants/http.ts';
import { handleCustomConfiguration } from '@core/setup/utils/handleCustomConfiguration.ts';
import type { InternalSetupImpl, InternalSetupMethod } from '@typedefs/internal/InternalSetupImpl.ts';
import { HookRegistryImpl } from '@core/execution/HookRegistryImpl.ts';
import type { InternalGlobalHookOptions } from '@typedefs/internal/InternalHookRegistryImpl.js';
import type { ServerConfiguration } from '@typedefs/public/Configuration.js';
import type { InternalRouteRegistryOptions } from '@typedefs/internal/InternalRouteRegistryImpl.js';
import { RouteRegistryImpl } from '@core/setup/RouteRegistryImpl.ts';
import type { HandlerCallback } from '@typedefs/public/Context.js';

export class SetupImpl implements InternalSetupImpl {
  readonly _configuration: ServerConfiguration;
  readonly _routeRegistry = new RouteRegistryImpl();
  readonly _hooks = new HookRegistryImpl();

  constructor(customConfiguration?: ServerConfiguration) {
    this._configuration = handleCustomConfiguration(customConfiguration);
  }

  //   ===== Route Registration =====
  get(path: string, handler: HandlerCallback, options?: InternalRouteRegistryOptions): void {
    this._routeRegistry._register({ method: httpMethod.get, handler, path, options: options ?? { beforeHooks: [], afterHooks: [] } });
  }

  post(path: string, handler: HandlerCallback, options?: InternalRouteRegistryOptions): void {
    this._routeRegistry._register({ method: httpMethod.post, handler, path, options: options ?? { beforeHooks: [], afterHooks: [] } });
  }

  put(path: string, handler: HandlerCallback, options?: InternalRouteRegistryOptions): void {
    this._routeRegistry._register({ method: httpMethod.put, handler, path, options: options ?? { beforeHooks: [], afterHooks: [] } });
  }

  patch(path: string, handler: HandlerCallback, options?: InternalRouteRegistryOptions): void {
    this._routeRegistry._register({ method: httpMethod.patch, handler, path, options: options ?? { beforeHooks: [], afterHooks: [] } });
  }

  delete(path: string, handler: HandlerCallback, options?: InternalRouteRegistryOptions): void {
    this._routeRegistry._register({ method: httpMethod.delete, handler, path, options: options ?? { beforeHooks: [], afterHooks: [] } });
  }

  options(path: string, handler: HandlerCallback, options?: InternalRouteRegistryOptions): void {
    this._routeRegistry._register({ method: httpMethod.options, handler, path, options: options ?? { beforeHooks: [], afterHooks: [] } });
  }

  group(
    prefix: string,
    callback: (group: Record<Lowercase<THttpMethod>, InternalSetupMethod>) => void,
    options?: InternalRouteRegistryOptions, // These follow the same pattern as the individual route registration methods
  ): void {
    const createRouteHandler =
      (method: THttpMethod) =>
      (path: string, handler: HandlerCallback, routeOptions?: InternalRouteRegistryOptions): void => {
        const fullPath = `${prefix}${path}`;
        this._routeRegistry._register({
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
  beforeAll(handlers: Array<HandlerCallback>, options?: InternalGlobalHookOptions): void {
    this._hooks._addBeforeHooks(handlers, options);
  }

  afterAll(handlers: Array<HandlerCallback>, options?: InternalGlobalHookOptions): void {
    this._hooks._addAfterHooks(handlers, options);
  }

  onError(handler: HandlerCallback): void {
    this._hooks._addOnError(handler);
  }

  onNotFound(handler: HandlerCallback): void {
    this._hooks._addOnNotFound(handler);
  }
}
