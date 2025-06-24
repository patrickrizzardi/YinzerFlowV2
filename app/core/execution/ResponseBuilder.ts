import { httpStatus, httpStatusCode } from '@constants/http.ts';
import type { Setup } from '@core/setup/Setup.ts';
import type { THttpHeaders, THttpStatus, THttpStatusCode } from '@typedefs/constants/http.js';
import type { IRequest, IResponse, TResponseBody } from '@typedefs/core/Context.js';
import type { IResponseBuilder } from '@typedefs/core/execution/ResponseBuilder.js';

export class ResponseBuilder implements IResponseBuilder {
  readonly statusCode: THttpStatusCode = httpStatusCode.ok;
  readonly status: THttpStatus = httpStatus.ok;
  readonly headers: Partial<Record<THttpHeaders, string>> = {};
  readonly body: TResponseBody = {};
  readonly rawResponse: string;

  constructor(setup: Setup, request: IRequest) {
    this.rawResponse = this.buildRawResponse(request);
  }

  /**
   * Build the raw response
   * This is the standard HTTP response format that will be sent to the client.
   */
  private buildRawResponse(request: IRequest): string {
    // Example: HTTP/1.1 200 OK
    const statusLine = `${request.protocol} ${this.statusCode} ${this.status}`;

    // Example: Content-Type: text/html
    const headerLines = Object.entries(this.headers).map(([key, value]) => `${key}: ${value}`);

    // Example: <html><body><h1>Hello, world!</h1></body></html> or { "message": "Hello, world!" }
    const body = formatBodyIntoString(this.body);

    // Example: HTTP/1.1 200 OK\nContent-Type: text/html\n\n<html><body><h1>Hello, world!</h1></body></html>
    return `${statusLine}\n${headerLines.join('\n')}\n\n${body}`;
  }

  getResponse(): IResponse {
    return this;
  }
}

const formatBodyIntoString = (body: TResponseBody): string => {
  if (typeof body === 'object') return JSON.stringify(body);
  if (typeof body === 'string') return body;
  throw new Error('Invalid body type');
};
