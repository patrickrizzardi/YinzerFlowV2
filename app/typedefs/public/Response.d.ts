import type { THttpHeaders, THttpStatusCode } from '@typedefs/constants/http.js';

/**
 * Public facing response object
 *
 * This is the response object that is sent to the client.
 */
export interface Response {
  setStatusCode: (statusCode: THttpStatusCode) => void;
  addHeaders: (headers: Partial<Record<THttpHeaders, string>>) => void;
  removeHeaders: (headerNames: Array<THttpHeaders>) => void;
}
