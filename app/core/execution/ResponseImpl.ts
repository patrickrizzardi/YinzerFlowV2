import { formatBodyIntoString } from '@core/execution/utils/formatBodyIntoString.ts';
import { determineEncoding } from '@core/execution/utils/determineEncoding.ts';
import { inferContentType } from '@core/execution/utils/inferContentType.ts';
import { mapStatusCodeToMessage } from '@core/execution/utils/mapStatusCodeToMessage.ts';
import { httpStatus, httpStatusCode } from '@constants/http.ts';
import type { THttpHeaders, THttpStatus, THttpStatusCode } from '@typedefs/constants/http.js';
import type { Request } from '@typedefs/public/Request.ts';
import type { InternalResponseImpl } from '@typedefs/internal/InternalResponseImpl.d.ts';

export class ResponseImpl implements InternalResponseImpl {
  readonly _request: Request;

  _statusCode: THttpStatusCode = httpStatusCode.ok;
  _status: THttpStatus = httpStatus.ok;
  _headers: Partial<Record<THttpHeaders, string>> = {};
  _body: unknown = '';

  constructor(request: Request) {
    this._request = request;
  }

  _parseResponseIntoString(): string {
    // Example: HTTP/1.1 200 OK
    const statusLine = `${this._request.protocol} ${this._statusCode} ${this._status}`;

    // Example: Content-Type: text/html
    const headerLines = Object.entries(this._headers).map(([key, value]) => `${key}: ${value}`);

    // Determine encoding based on Content-Type header and body content
    const encoding = determineEncoding(this._headers['content-type'], this._body);

    // Example: <html><body><h1>Hello, world!</h1></body></html> or { "message": "Hello, world!" }
    const body = formatBodyIntoString(this._body, { encoding });

    // Example: HTTP/1.1 200 OK\nContent-Type: text/html\n\n<html><body><h1>Hello, world!</h1></body></html>
    return `${statusLine}\n${headerLines.join('\n')}\n\n${body}`;
  }

  private _setHeadersIfNotSet(headers: Partial<Record<THttpHeaders, string>>): void {
    for (const [key, value] of Object.entries(headers)) {
      if (!(key in this._headers)) {
        this._headers[key] = value;
      }
    }
  }

  _setBody(body: unknown): void {
    this._body = body;

    // Auto-set content-type if not already set
    if (!this._headers['content-type']) {
      const detectedContentType = inferContentType(body);
      this._setHeadersIfNotSet({
        'content-type': detectedContentType,
      });
    }
  }

  setStatusCode(statusCode: THttpStatusCode): void {
    this._statusCode = statusCode;
    this._status = mapStatusCodeToMessage(statusCode);
  }

  addHeaders(headers: Partial<Record<THttpHeaders, string>>): void {
    this._headers = { ...this._headers, ...headers };
  }

  removeHeaders(headerNames: Array<THttpHeaders>): void {
    for (const headerName of headerNames) {
      delete this._headers[headerName];
    }
  }
}
