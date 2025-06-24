import { RequestBuilder } from '@core/execution/RequestBuilder.ts';
import { ResponseBuilder } from '@core/execution/ResponseBuilder.ts';
import type { Setup } from '@core/setup/Setup.ts';

/**
 * ContextBuilder is the core class that handles the building of the context.
 * It is responsible for building the request and response objects.
 */
export class ContextBuilder {
  readonly request: RequestBuilder;
  readonly response: ResponseBuilder;

  constructor(rawRequest: Buffer, setup: Setup) {
    this.request = new RequestBuilder(rawRequest, setup);
    this.response = new ResponseBuilder(this.request.getRequest());
  }
}
