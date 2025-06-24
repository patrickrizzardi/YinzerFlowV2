import type { THttpMethod } from '@typedefs/constants/http.js';
import { divideString } from '@utils/string.ts';

/**
 * Parse raw HTTP request string into its components that are needed for the request builder
 *
 * @example
 * ```ts
 * parseHttpRequest('GET /path?key1=value1&key2=value2 HTTP/1.1\r\nHost: example.com\r\n\r\n');
 * // Returns { method: 'GET', path: '/path?key1=value1&key2=value2', protocol: 'HTTP/1.1', headersRaw: 'Host: example.com\r\n', rawBody: '' }
 * ```
 */
export const parseHttpRequest = (request: string): { method: THttpMethod; path: string; protocol: string; headersRaw: string; rawBody: string } => {
  /**
   * The request is a string that contains the following information:
   * - The first line contains the request method, path, and protocol
   * - The headers are separated from the body by two newlines
   */
  const [firstLine, rest] = divideString(request, '\r\n');
  const [method, path, protocol] = firstLine.split(' ', 3) as [THttpMethod, string, string];
  const [headersRaw, rawBody] = divideString(rest, '\r\n\r\n');

  return {
    method,
    path,
    protocol,
    headersRaw,
    rawBody,
  };
};
