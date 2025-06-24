import { RequestBuilder } from '@core/execution/RequestBuilder.ts';
import { ResponseBuilder } from '@core/execution/ResponseBuilder.ts';
import type { Setup } from '@core/setup/Setup.ts';
import type { IContext } from '@typedefs/core/Context.js';
import type { IContextBuilder } from '@typedefs/core/execution/ContextBuilder.js';

/**
 * ContextBuilder is the core class that handles the building of the context.
 * It is responsible for building the request and response objects.
 */
export class ContextBuilder implements IContextBuilder {
  private readonly request: RequestBuilder;
  private readonly response: ResponseBuilder;

  constructor(rawRequest: Buffer, setup: Setup) {
    this.request = new RequestBuilder(rawRequest, setup);
    this.response = new ResponseBuilder(this.request.getRequest());
  }

  /**
   * Get the context
   *
   * @example
   * ```typescript
   * const context = builder.getContext();
   * ```
   */
  getContext(): IContext {
    return {
      request: this.request.getRequest(),
      response: this.response.getFormattedResponse(),
      rawResponse: this.response.getRawResponse(),
    };
  }
}
