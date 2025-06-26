/**
 * Parse JSON request body with proper error handling
 *
 * @example
 * ```ts
 * parseApplicationJson('{"name": "John", "age": 30}');
 * // Returns { name: 'John', age: 30 }
 * ```
 */
export const parseApplicationJson = (body: string): unknown => {
  // Handle empty strings, whitespace, and null characters
  if (!body || !body.trim() || body.trim() === '\0') {
    return undefined;
  }

  try {
    return JSON.parse(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON: ${message}`);
  }
};
