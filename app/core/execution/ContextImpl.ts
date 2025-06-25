import { RequestImpl } from '@core/execution/RequestImpl.ts';
import { ResponseBuilder } from '@core/execution/ResponseBuilder.ts';
import type { SetupImpl } from '@core/setup/Setup.ts';
import type { Request } from '@typedefs/public/Request.ts';
import type { Response } from '@typedefs/public/Response.ts';

/**
 * ContextImpl is the core class that handles the building of the context.
 * It is responsible for building the request and response objects.
 */
export class ContextImpl {
  readonly _request: RequestImpl;
  readonly _response: ResponseBuilder;

  request: Request;
  response: Response;

  constructor(rawRequest: Buffer, setup: SetupImpl) {
    this._request = new RequestImpl(rawRequest, setup);
    this._response = new ResponseBuilder(this._request);

    this.request = this._request;
    this.response = this._response;
  }
}
