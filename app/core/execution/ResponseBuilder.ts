import { formatBodyIntoString } from '@core/execution/utils/formatBodyIntoString.ts';
import { determineEncoding } from '@core/execution/utils/determineEncoding.ts';
import { inferContentType } from '@core/execution/utils/inferContentType.ts';
import { mapStatusCodeToMessage } from '@core/execution/utils/mapStatusCodeToMessage.ts';
import { httpStatus, httpStatusCode } from '@constants/http.ts';
import type { THttpHeaders, THttpStatus, THttpStatusCode } from '@typedefs/constants/http.js';
import type { Request } from '@typedefs/public/Request.ts';
import type { ResponseResolved } from '@typedefs/internal/ResponseResolved.js';

export class ResponseBuilder implements ResponseResolved {
  private readonly request: Request;

  statusCode: THttpStatusCode;
  status: THttpStatus;
  headers: Partial<Record<THttpHeaders, string>>;
  body: unknown;

  constructor(request: Request) {
    this.request = request;

    this.statusCode = httpStatusCode.ok;
    this.status = httpStatus.ok;
    this.headers = {};
    this.body = '';
  }

  _parseResponseIntoString(): string {
    // Example: HTTP/1.1 200 OK
    const statusLine = `${this.request.protocol} ${this.statusCode} ${this.status}`;

    // Example: Content-Type: text/html
    const headerLines = Object.entries(this.headers).map(([key, value]) => `${key}: ${value}`);

    // Determine encoding based on Content-Type header and body content
    const encoding = determineEncoding(this.headers['content-type'], this.body);

    // Example: <html><body><h1>Hello, world!</h1></body></html> or { "message": "Hello, world!" }
    const body = formatBodyIntoString(this.body, { encoding });

    // Example: HTTP/1.1 200 OK\nContent-Type: text/html\n\n<html><body><h1>Hello, world!</h1></body></html>
    return `${statusLine}\n${headerLines.join('\n')}\n\n${body}`;
  }

  private _setHeadersIfNotSet(headers: Partial<Record<THttpHeaders, string>>): void {
    for (const [key, value] of Object.entries(headers)) {
      if (!(key in this.headers)) {
        this.headers[key] = value;
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
  _setBody(body: unknown): void {
    this.body = body;

    // Auto-set content-type if not already set
    if (!this.headers['content-type']) {
      const detectedContentType = inferContentType(body);
      this._setHeadersIfNotSet({
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
    this.statusCode = statusCode;
    this.status = mapStatusCodeToMessage(statusCode);
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
    this.headers = { ...this.headers, ...headers };
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
      delete this.headers[headerName];
    }
  }
}
