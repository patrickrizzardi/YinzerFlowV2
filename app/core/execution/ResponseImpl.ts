import { formatBodyIntoString } from '@core/execution/utils/formatBodyIntoString.ts';
import { determineEncoding } from '@core/execution/utils/determineEncoding.ts';
import { inferContentType } from '@core/execution/utils/inferContentType.ts';
import { mapStatusCodeToMessage } from '@core/execution/utils/mapStatusCodeToMessage.ts';
import { httpEncoding, httpStatus, httpStatusCode } from '@constants/http.ts';
import type { InternalHttpEncoding, InternalHttpHeaders, InternalHttpStatus, InternalHttpStatusCode } from '@typedefs/constants/http.js';
import type { Request } from '@typedefs/public/Request.ts';
import type { InternalResponseImpl } from '@typedefs/internal/InternalResponseImpl.d.ts';

export class ResponseImpl implements InternalResponseImpl {
  readonly _request: Request;

  _statusCode: InternalHttpStatusCode = httpStatusCode.ok;
  _status: InternalHttpStatus = httpStatus.ok;
  _headers: Partial<Record<InternalHttpHeaders, string>> = {};
  _body: unknown = '';
  _stringBody = '';
  _encoding: InternalHttpEncoding = httpEncoding.utf8;

  constructor(request: Request) {
    this._request = request;
  }

  _parseResponseIntoString(): void {
    // Example: HTTP/1.1 200 OK
    const statusLine = `${this._request.protocol} ${this._statusCode} ${this._status}`;

    // Example: Content-Type: text/html
    const headerLines = Object.entries(this._headers).map(([key, value]) => `${key}: ${value}`);

    // Determine encoding based on Content-Type header and body content
    const encoding = determineEncoding(this._headers['content-type'], this._body);

    // Example: <html><body><h1>Hello, world!</h1></body></html> or { "message": "Hello, world!" }
    const body = formatBodyIntoString(this._body, { encoding });

    // Example: HTTP/1.1 200 OK\nContent-Type: text/html\n\n<html><body><h1>Hello, world!</h1></body></html>
    this._encoding = encoding;
    this._stringBody = `${statusLine}\n${headerLines.join('\n')}\n\n${body}`;
  }

  _setHeadersIfNotSet(headers: Partial<Record<InternalHttpHeaders, string>>): void {
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
        'Content-Type': detectedContentType,
      });
    }
  }

  setStatusCode(statusCode: InternalHttpStatusCode): void {
    this._statusCode = statusCode;
    this._status = mapStatusCodeToMessage(statusCode);
  }

  addHeaders(headers: Partial<Record<InternalHttpHeaders, string>>): void {
    this._headers = { ...this._headers, ...headers };
  }

  removeHeaders(headerNames: Array<InternalHttpHeaders>): void {
    for (const headerName of headerNames) {
      delete this._headers[headerName];
    }
  }
}
