/**
 * Parse URL-encoded form data
 *
 * @example
 * ```ts
 * parseUrlEncodedForm('name=John&age=30');
 * // Returns { name: 'John', age: '30' }
 * ```
 */
export const parseUrlEncodedForm = (body: string): Record<string, string> => {
  const params: Record<string, string> = {};
  const pairs = body.split('&');

  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key) {
      try {
        const decodedKey = decodeURIComponent(key);
        const decodedValue = value ? decodeURIComponent(value) : '';
        params[decodedKey] = decodedValue;
      } catch {
        // Handle malformed URL encoding gracefully by using original values
        params[key] = value ?? '';
      }
    }
  }

  return params;
};
