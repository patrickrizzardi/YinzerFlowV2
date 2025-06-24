import { formatBodyIntoString } from '@core/execution/utils/formatBodyIntoString.ts';
import { determineEncoding } from '@core/execution/utils/determineEncoding.ts';
import { inferContentType } from '@core/execution/utils/inferContentType.ts';
import { mapStatusCodeToMessage } from '@core/execution/utils/mapStatusCodeToMessage.ts';
import type { IRequest, IResponse, TResponseBody } from '@typedefs/core/Context.js';
import type { IResponseBuilder } from '@typedefs/core/execution/ResponseBuilder.js';
import { httpStatus, httpStatusCode } from '@constants/http.ts';
import type { THttpHeaders, THttpStatusCode } from '@typedefs/constants/http.js';

export class ResponseBuilder implements IResponseBuilder {
  private readonly formattedResponse: IResponse;
  private readonly request: IRequest;

  constructor(request: IRequest) {
    this.request = request;
    this.formattedResponse = {
      statusCode: httpStatusCode.ok,
      status: httpStatus.ok,
      headers: {},
      body: '',
    };
  }

  /**
   * @internal
   * Build the raw response
   * This is the standard HTTP response format that will be sent to the client.
   *
   * @example
   * ```typescript
   * const rawResponse = builder.buildRawResponse(request);
   * ```
   */
  private buildRawResponse(request: IRequest): string {
    // Example: HTTP/1.1 200 OK
    const statusLine = `${request.protocol} ${this.formattedResponse.statusCode} ${this.formattedResponse.status}`;

    // Example: Content-Type: text/html
    const headerLines = Object.entries(this.formattedResponse.headers).map(([key, value]) => `${key}: ${value}`);

    // Determine encoding based on Content-Type header and body content
    const encoding = determineEncoding(this.formattedResponse.headers['content-type'], this.formattedResponse.body);

    // Example: <html><body><h1>Hello, world!</h1></body></html> or { "message": "Hello, world!" }
    const body = formatBodyIntoString(this.formattedResponse.body, { encoding });

    // Example: HTTP/1.1 200 OK\nContent-Type: text/html\n\n<html><body><h1>Hello, world!</h1></body></html>
    return `${statusLine}\n${headerLines.join('\n')}\n\n${body}`;
  }

  /**
   * @internal
   * This is the raw response that will be sent to the client.
   *
   * @example
   * ```typescript
   * const rawResponse = builder.getRawResponse();
   * ```
   */
  getRawResponse(): string {
    return this.buildRawResponse(this.request);
  }

  /**
   * @internal
   * Get the formatted response
   *
   * @example
   * ```typescript
   * const formattedResponse = builder.getFormattedResponse();
   * ```
   */
  getFormattedResponse(): IResponse {
    return this.formattedResponse;
  }

  /**
   * @internal
   * Add headers only if they don't already exist
   * Use when you want to provide defaults without overriding user-set headers.
   * This will typically be used by the framework to set default headers.
   *
   * @example
   * ```typescript
   * // Set default headers that user can override
   * builder.setHeadersIfNotSet({
   *   'cache-control': 'public, max-age=3600',
   *   'x-powered-by': 'YinzerFlow'
   * });
   * ```
   */
  setHeadersIfNotSet(headers: Partial<Record<THttpHeaders, string>>): void {
    for (const [key, value] of Object.entries(headers)) {
      if (!(key in this.formattedResponse.headers)) {
        this.formattedResponse.headers[key] = value;
      }
    }
  }

  /**
   * Set the body of the response
   * Accepts any response body type and automatically infers content-type if not set
   *
   * @param body - Response body (string, object, Buffer, etc.)
   *
   * @example
   * ```typescript
   * // String body
   * builder.setBody('Hello, world!');
   *
   * // JSON object
   * builder.setBody({ message: 'Hello', count: 42 });
   *
   * // Binary data
   * const imageBuffer = fs.readFileSync('image.jpg');
   * builder.setBody(imageBuffer);
   * ```
   */
  setBody(body: TResponseBody): void {
    this.formattedResponse.body = body;

    // Auto-set content-type if not already set
    if (!this.formattedResponse.headers['content-type']) {
      const detectedContentType = inferContentType(body);
      this.setHeadersIfNotSet({
        'content-type': detectedContentType,
      });
    }
  }

  /**
   * Set the status code and status message for the response
   *
   * @example
   * ```typescript
   * builder.setStatusCode(httpStatusCode.ok);
   * builder.setStatusCode(404);
   * ```
   */
  setStatusCode(statusCode: THttpStatusCode): void {
    this.formattedResponse.statusCode = statusCode;
    this.formattedResponse.status = mapStatusCodeToMessage(statusCode);
  }

  /**
   * Add headers to the response, overwriting any existing headers with the same name
   * This is the primary method for setting headers - use when you want to ensure
   * your headers take precedence (e.g., framework setting content-type, user setting CORS)
   *
   * @example
   * ```typescript
   * // Framework usage - ensure correct content-type
   * builder.addHeaders({ 'content-type': 'application/json' });
   *
   * // User usage - set CORS headers
   * builder.addHeaders({
   *   'access-control-allow-origin': '*',
   *   'cache-control': 'no-cache'
   * });
   * ```
   */
  addHeaders(headers: Partial<Record<THttpHeaders, string>>): void {
    this.formattedResponse.headers = { ...this.formattedResponse.headers, ...headers };
  }

  /**
   * Remove headers from the response
   * Useful for removing headers set by defaults or previous middleware
   *
   * @param headerNames - Names of headers to remove
   *
   * @example
   * ```typescript
   * // Remove security headers for specific endpoints
   * builder.removeHeaders(['x-frame-options', 'x-content-type-options']);
   * ```
   */
  removeHeaders(headerNames: Array<THttpHeaders>): void {
    for (const headerName of headerNames) {
      delete this.formattedResponse.headers[headerName];
    }
  }
}
