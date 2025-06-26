import type { THttpHeaders, THttpStatus, THttpStatusCode } from '@typedefs/constants/http.js';
import type { Request } from '@typedefs/public/Request.js';
import type { Response } from '@typedefs/public/Response.js';

export interface InternalResponseImpl extends Response {
  readonly _request: Request;
  _statusCode: THttpStatusCode;
  _status: THttpStatus;
  _headers: Partial<Record<THttpHeaders, string>>;
  _body: unknown;
  _parseResponseIntoString: () => string;
  _setBody: (body: unknown) => void;
}
