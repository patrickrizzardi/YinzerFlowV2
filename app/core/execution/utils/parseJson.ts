import type { TJsonData, TRequestBody } from '@typedefs/core/Context.ts';

/**
 * Parse JSON request body with proper error handling
 *
 * @example
 * ```ts
 * parseApplicationJson('{"name": "John", "age": 30}');
 * // Returns { name: 'John', age: 30 }
 * ```
 */
export const parseApplicationJson = (body: string): TRequestBody => {
  // Handle empty strings, whitespace, and null characters
  if (!body || !body.trim() || body.trim() === '\0') {
    return undefined;
  }

  try {
    return JSON.parse(body) as TJsonData;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON: ${message}`);
  }
};
