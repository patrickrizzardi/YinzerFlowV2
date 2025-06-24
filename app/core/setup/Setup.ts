import { httpMethod, httpStatus, httpStatusCode } from '@constants/http.ts';
import type { THttpMethod } from '@typedefs/constants/http.ts';
import { RouteRegistry } from '@core/setup/RouteRegistry.ts';
import type { ContextBuilder, TResponseBody, TResponseFunction } from '@typedefs/core/Context.js';
import type { IRoute } from '@typedefs/core/setup/RouteRegistry.js';
import type { IGroup, IHookOptions, IHookRegistry, TAfterHookResponse, TBeforeHookResponse } from '@typedefs/core/setup/Setup.js';
import type { IServerConfiguration } from '@typedefs/core/YinzerFlow.js';
import { handleCustomConfiguration } from '@core/setup/utils/handleCustomConfiguration.ts';

export class Setup {
  private readonly configuration: IServerConfiguration;
  private readonly routeRegistry = new RouteRegistry();
  private readonly hooks: IHookRegistry = {
    beforeAll: new Set(),
    afterAll: new Set(),
    onError: (ctx: ContextBuilder): TResponseBody => {
      ctx.response.setStatusCode(500);
      return {
        success: false,
        message: 'Internal Server Error',
      };
    },
  };

  constructor(customConfiguration?: IServerConfiguration) {
    this.configuration = handleCustomConfiguration(customConfiguration);
  }

  //   ===== Route Registration =====
  get(path: string, handler: IRoute['handler'], options?: IRoute['options']): void {
    this.routeRegistry.register({ method: httpMethod.get, handler, path, options });
  }

  post(path: string, handler: IRoute['handler'], options?: IRoute['options']): void {
    this.routeRegistry.register({ method: httpMethod.post, handler, path, options });
  }

  put(path: string, handler: IRoute['handler'], options?: IRoute['options']): void {
    this.routeRegistry.register({ method: httpMethod.put, handler, path, options });
  }

  patch(path: string, handler: IRoute['handler'], options?: IRoute['options']): void {
    this.routeRegistry.register({ method: httpMethod.patch, handler, path, options });
  }

  delete(path: string, handler: IRoute['handler'], options?: IRoute['options']): void {
    this.routeRegistry.register({ method: httpMethod.delete, handler, path, options });
  }

  options(path: string, handler: IRoute['handler'], options?: IRoute['options']): void {
    this.routeRegistry.register({ method: httpMethod.options, handler, path, options });
  }

  group(prefix: string, callback: (group: IGroup) => void, options?: IRoute['options']): void {
    const createRouteHandler =
      (method: THttpMethod) =>
      (path: string, handler: IRoute['handler'], routeOptions?: IRoute['options']): void => {
        const fullPath = `${prefix}${path}`;
        this.routeRegistry.register({
          method,
          handler,
          path: fullPath,
          options: {
            beforeHooks: [...(options?.beforeHooks ?? []), ...(routeOptions?.beforeHooks ?? [])],
            afterHooks: [...(routeOptions?.afterHooks ?? []), ...(options?.afterHooks ?? [])],
            ...(routeOptions?.rawBody !== undefined && { rawBody: routeOptions.rawBody }),
            ...(routeOptions?.rawBody === undefined && options?.rawBody !== undefined && { rawBody: options.rawBody }),
          },
        });
      };

    // Create a group app that registers routes with prefix and group hooks
    const group: IGroup = {
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
  beforeAll(handler: TBeforeHookResponse, options?: IHookOptions): void {
    this.hooks.beforeAll.add({ handler, options });
  }

  afterAll(handler: TAfterHookResponse, options?: IHookOptions): void {
    this.hooks.afterAll.add({ handler, options });
  }

  /**
   * Error Handling
   */
  onError(handler: TResponseFunction): void {
    this.hooks.onError = handler;
  }

  /**
   * @internal
   * Get the route registry
   *
   * @example
   * ```typescript
   * const routeRegistry = setup.getRouteRegistry();
   * ```
   */
  getRouteRegistry(): RouteRegistry {
    return this.routeRegistry;
  }

  /**
   * @internal
   * Get the hooks
   *
   * @example
   * ```typescript
   * const hooks = setup.getHooks();
   * ```
   */
  getHooks(): IHookRegistry {
    return this.hooks;
  }

  /**
   * @internal
   * Get the configuration
   *
   * @example
   * ```typescript
   * const configuration = setup.getConfiguration();
   * ```
   */
  getConfiguration(): IServerConfiguration {
    return this.configuration;
  }
}
