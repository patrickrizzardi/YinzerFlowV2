import { RequestBuilder } from '@core/execution/RequestBuilder.ts';
import { ResponseBuilder } from '@core/execution/ResponseBuilder.ts';
import type { Setup } from '@core/setup/Setup.ts';
import type { IContext, IRequest, IResponse } from '@typedefs/core/Context.js';
import type { IContextBuilder } from '@typedefs/core/execution/ContextBuilder.js';

/**
 * ContextBuilder is the core class that handles the building of the context.
 * It is responsible for building the request and response objects.
 */
export class ContextBuilder implements IContextBuilder {
  private readonly request: IRequest;
  private readonly response: IResponse;

  constructor(rawRequest: Buffer, setup: Setup) {
    this.request = new RequestBuilder(rawRequest, setup).getRequest();
    this.response = new ResponseBuilder(setup, this.request).getResponse();

  }

  getContext(): IContext {
    return {
      request: this.request,
      response: this.response,
    };
  }
}
