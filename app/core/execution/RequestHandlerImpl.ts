import type { SetupImpl } from '@core/setup/SetupImpl.ts';
import type { InternalContextImpl } from '@typedefs/internal/InternalContextImpl.ts';
import type { InternalSetupImpl } from '@typedefs/internal/InternalSetupImpl.js';

/**
 * Handles the complete lifecycle of an HTTP request
 *
 * Flow:
 * 1. Receive parsed context (request + response builders)
 * 2. Match route and execute handlers
 * 3. Build final response in context
 * 4. Context.rawResponse is ready for sending
 */
export class RequestHandlerImpl {
  private readonly setup: InternalSetupImpl;

  constructor(setup: SetupImpl) {
    this.setup = setup;
  }

  /**
   * Process an HTTP request using the provided context
   *
   * @param context - Complete request context with request/response builders
   *
   * @example
   * ```typescript
   * const context = new ContextImpl(rawData, setup).getContext();
   * await handler.handle(context);
   * socket.write(context.rawResponse);
   * ```
   */
  async handle(context: InternalContextImpl): Promise<void> {
    try {
      // 1. Match route based on context.request.method + context.request.path
      const matchedRoute = this.setup._routeRegistry._findRoute(context.request.method, context.request.path);
      if (!matchedRoute) {
        const notFoundResponse = await this.setup._hooks._onNotFound(context);
        context._response._setBody(notFoundResponse);
        return;
      }

      const { route } = matchedRoute;
      const { handler, options } = route;
      const { beforeHooks, afterHooks } = options;

      // 2. Run beforeAll hooks
      const beforeAllHooks = this.setup._hooks._beforeAll;
      for (const hook of beforeAllHooks) await hook.handler(context);

      // 3. Run beforeGroup hooks and beforeRoute hooks
      // The before group hooks and beforeRoute hooks are in the same array and ordered on route registration.
      for (const hook of beforeHooks) await hook(context);

      // 4. Execute route handler. We are saving the response to a variable because in this case we might not
      // send a response to the client until after the after hooks since the after hooks might modify the response.
      const routeResponse = await handler(context);

      // 5. Run afterRoute hooks and afterGroup hooks
      // The after group hooks and afterRoute hooks are in the same array and ordered on route registration.
      for (const hook of afterHooks) await hook(context);

      // 6. Run afterAll hooks
      const afterAllHooks = this.setup._hooks._afterAll;
      for (const hook of afterAllHooks) await hook.handler(context);

      // 7. Build response (set content-type, etc.)
      context._response._setBody(routeResponse);
    } catch (error) {
      // Use the error handler from setup
      await this.handleError(context, error);
    }
  }

  /**
   * Handle errors using the user-defined or default error handler
   * The error handler returns a response object that we apply to the context
   */
  private async handleError(context: InternalContextImpl, error: unknown): Promise<void> {
    console.error('Request handling error:', error);

    try {
      // Get the error handler (user-defined or default)
      const errorHandler = this.setup._hooks._onError;

      // Call the error handler - it returns a response object
      const errorResponse = await errorHandler(context);

      // Apply the response to the context
      context._response._setBody(errorResponse);
    } catch (errorHandlerError) {
      // If the error handler itself fails, fall back to basic response
      console.error('Error handler failed:', errorHandlerError);

      context.response.setStatusCode(500);
      context._response._setBody({
        success: false,
        message: 'Internal Server Error',
      });
    }
  }
}
