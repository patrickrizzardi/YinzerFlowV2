import { parseApplicationJson } from './parseJson.ts';
import { parseMultipartFormData } from './parseMultipart.ts';
import { contentType } from '@constants/http.ts';
import type { TRequestBody } from '@typedefs/core/Context.ts';

import { parseUrlEncodedForm } from '@core/execution/utils/parseUrlEncodedForm.ts';
import type { TContentType } from '@typedefs/constants/http.js';

/**
 * Parse request body based on Content-Type header
 *
 * This function determines the appropriate parsing strategy based on the Content-Type header:
 * - application/json: Parse as JSON
 * - multipart/form-data: Parse as multipart with file uploads
 * - text/*: Return as raw string
 * - default: Return as Buffer for binary data
 *
 * @param headers - Request headers
 * @param body - Raw request body string
 * @param config - Server configuration with parser options
 * @returns Parsed body in appropriate format
 * @throws Error if Content-Type is missing or parsing fails
 */
export const parseBody = (body: string, headerContentType?: TContentType, boundary?: string): TRequestBody => {
  // Handle empty body
  if (!body || !body.trim()) {
    return undefined;
  }

  // Determine the content type - either passed in or inferred
  const mainContentType = headerContentType ?? inferContentType(body);

  // Parse based on Content-Type
  if (mainContentType === contentType.json) return parseApplicationJson(body);

  if (mainContentType === contentType.multipart) {
    if (!boundary) throw new Error('Invalid multipart form data: missing boundary');
    return parseMultipartFormData(body, boundary);
  }

  if (mainContentType === contentType.form) {
    return parseUrlEncodedForm(body);
  }

  // For all other content types, return the raw body
  return body;
};

/**
 * Infer content type from body content when Content-Type header is missing
 */
const inferContentType = (body: string): string => {
  const trimmedBody = body.trim();

  // Try to detect JSON - but validate it's actually parseable
  if ((trimmedBody.startsWith('{') && trimmedBody.endsWith('}')) || (trimmedBody.startsWith('[') && trimmedBody.endsWith(']'))) {
    try {
      JSON.parse(trimmedBody);
      return contentType.json;
    } catch {
      // Not valid JSON, continue with other checks
    }
  }

  // Try to detect URL-encoded form data
  if (trimmedBody.includes('=') && trimmedBody.includes('&')) {
    return contentType.form;
  }

  // Default to plain text
  return 'text/plain';
};
