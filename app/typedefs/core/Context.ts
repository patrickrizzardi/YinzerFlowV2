import type { HttpHeaders, HttpStatus, HttpStatusCode } from 'typedefs/constants/http.ts';

export interface Context {
  request: Request;
  response: Response;
}

/**
 * Represents a JSON data object after parsing
 *
 * This type is a generic wrapper for the JSON data object,
 * allowing for type-safe JSON data with custom data structures.
 *
 * @template T - The type of the JSON data content
 */
export type JsonData<T = unknown> = Record<string, T> & T;

/**
 * Represents multipart form data with file uploads
 *
 * This interface is used for handling form submissions that include file uploads.
 * It separates regular form fields from uploaded files for easier processing.
 */
export interface MultipartFormData {
  /** Regular form fields as key-value pairs */
  fields: Record<string, string>;
  /** Uploaded files indexed by field name */
  files: Array<{
    /** Original filename provided by the client */
    filename: string;
    /** MIME type of the file */
    contentType: string;
    /** Size of the file in bytes */
    size: number;
    /** file content */
    content: string;
    /** Additional metadata about the file */
    metadata?: Record<string, string>;
  }>;
}

/**
 * Represents the request object
 *
 * This is the request object that is sent to the server.
 */
export interface Request {
  protocol: string;
  method: string;
  path: string;
  headers: Record<HttpHeaders, string>;
  body: JsonData | MultipartFormData | string | undefined;
  query: Record<string, string> | undefined;
  params: Record<string, string> | undefined;

  // The ip address of the client (Configure proxy hops if behind a proxy, load balancer, etc.)
  ipAddress: string;
  //   cookies: Record<string, string>;
  //   session: Record<string, string>;
}

/**
 * Represents the response body
 *
 * This type is a generic wrapper for the response body content,
 * allowing for type-safe responses with custom data structures.
 *
 * @template T - The type of the response body content
 */
export type ResponseBody<T> = T;

/**
 * Represents the response object
 *
 * This is the response object that is sent to the client.
 */
export interface Response {
  statusCode: HttpStatusCode;
  status: HttpStatus;
  headers: Record<HttpHeaders, string>;
  body: ResponseBody<unknown>;
}
