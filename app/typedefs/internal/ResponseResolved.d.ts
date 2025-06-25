import type { THttpStatusCode } from '@typedefs/constants/http.js';

export interface ResponseResolved {
  _parseResponseIntoString: () => string;
  _setBody: (body: unknown) => void;
  setStatusCode: (statusCode: THttpStatusCode) => void;
  addHeaders: (headers: Record<string, string>) => void;
  removeHeaders: (headers: Array<string>) => void;
}
