import type { ContextBuilder } from '@core/execution/ContextBuilder.ts';
import type { Setup } from '@core/setup/Setup.ts';

/**
 * Handles the complete lifecycle of an HTTP request
 *
 * Flow:
 * 1. Receive parsed context (request + response builders)
 * 2. Match route and execute handlers
 * 3. Build final response in context
 * 4. Context.rawResponse is ready for sending
 */
export class RequestHandler {
  private readonly setup: Setup;

  constructor(setup: Setup) {
    this.setup = setup;
  }

  /**
   * Process an HTTP request using the provided context
   *
   * @param context - Complete request context with request/response builders
   *
   * @example
   * ```typescript
   * const context = new ContextBuilder(rawData, setup).getContext();
   * await handler.handle(context);
   * socket.write(context.rawResponse);
   * ```
   */
  async handle(context: ContextBuilder): Promise<void> {
    try {
      // TODO: Implement the complete request pipeline
      // 1. Match route based on context.request.method + context.request.path
      // 2. Run before hooks
      // 3. Execute route handler
      // 4. Build response (set content-type, etc.)
      // 5. Run after hooks
      // 6. Finalize response

      // Simple test response
      context.response.setBody({
        message: 'Hello from YinzerFlow!',
      });
    } catch (error) {
      // Use the error handler from setup
      await this.handleError(context, error);
    }
  }

  /**
   * Handle errors using the user-defined or default error handler
   * The error handler returns a response object that we apply to the context
   */
  private async handleError(context: ContextBuilder, error: unknown): Promise<void> {
    console.error('Request handling error:', error);

    try {
      // Get the error handler (user-defined or default)
      const errorHandler = this.setup.getHooks().onError;

      // Call the error handler - it returns a response object
      const errorResponse = await errorHandler(context);

      // Apply the response to the context
      context.response.setBody(errorResponse);
    } catch (errorHandlerError) {
      // If the error handler itself fails, fall back to basic response
      console.error('Error handler failed:', errorHandlerError);

      context.response.setStatusCode(500);
      context.response.setBody({
        success: false,
        message: 'Internal Server Error',
      });
    }
  }
}
