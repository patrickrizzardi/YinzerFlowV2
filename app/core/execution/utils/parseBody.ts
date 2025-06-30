import { parseApplicationJson } from './parseJson.ts';
import { parseMultipartFormData } from './parseMultipart.ts';
import { contentType } from '@constants/http.ts';

import { parseUrlEncodedForm } from '@core/execution/utils/parseUrlEncodedForm.ts';
import type { InternalContentType } from '@typedefs/constants/http.js';
import { inferContentTypeFromString } from '@core/execution/utils/inferContentType.ts';

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
export const parseBody = (body: string, headerContentType?: InternalContentType, boundary?: string): unknown => {
  // Handle empty body
  if (!body || !body.trim()) {
    return undefined;
  }

  // Determine the content type - either passed in or inferred
  const mainContentType = headerContentType ?? inferContentTypeFromString(body);

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


