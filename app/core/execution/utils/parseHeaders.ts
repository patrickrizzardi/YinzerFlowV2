import type { THttpHeaders } from '@typedefs/constants/http.js';

/**
 * Parse the headers from the raw headers string
 *
 * @example
 * ```ts
 * parseHeaders('Host: example.com\r\nContent-Type: application/json\r\n\r\n');
 * // Returns { host: 'example.com', 'content-type': 'application/json' }
 * ```
 */
export const parseHeaders = (rawHeaders: string): Partial<Record<THttpHeaders, string>> => {
  const headers: Record<string, string> = {};
  if (!rawHeaders) return headers;

  // Normalize line endings and split
  const normalizedHeaders = rawHeaders.replace(/\r\n|\r|\n/g, '\n');
  const headerLines = normalizedHeaders.split('\n');

  for (const line of headerLines) {
    if (!line) continue;

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    if (key) {
      // Ensure the key is lowercase for consistency with the THttpHeaders type
      headers[key.toLowerCase()] = value;
    }
  }

  return headers;
};
