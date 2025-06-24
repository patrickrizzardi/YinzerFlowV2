import type { THttpHeaders, THttpStatus, THttpStatusCode } from '@typedefs/constants/http.ts';

export interface IContext {
  request: IRequest;
  response: IResponse;
  rawResponse: string;
}

/**
 * Represents a JSON data object after parsing
 *
 * This type is a generic wrapper for the JSON data object,
 * allowing for type-safe JSON data with custom data structures.
 *
 * @template T - The type of the JSON data content
 */
export type TJsonData<T = unknown> = Record<string, T> & T;

/**
 * Content-Disposition header parsed data
 */
export interface IContentDisposition {
  name: string;
  filename?: string;
}

/**
 * Uploaded file information
 */
export interface IUploadedFile {
  /** Original filename provided by the client */
  filename: string;
  /** MIME type of the file */
  contentType: string;
  /** Size of the file in bytes */
  size: number;
  /** File content - Buffer for binary files, string for text files */
  content: Buffer | string;
  /** Additional metadata about the file */
  metadata?: Record<string, string>;
}

/**
 * Represents multipart form data with file uploads
 *
 * This interface is used for handling form submissions that include file uploads.
 * It separates regular form fields from uploaded files for easier processing.
 */
export interface IMultipartFormData {
  /** Regular form fields as key-value pairs */
  fields: Record<string, string>;
  /** Uploaded files indexed by field name */
  files: Array<IUploadedFile>;
}

/**
 * All possible request body types after parsing
 */
export type TRequestBody = Buffer | IMultipartFormData | TJsonData | string | undefined;

/**
 * Represents the request object
 *
 * This is the request object that is sent to the server.
 */
export interface IRequest {
  protocol: string;
  method: string;
  path: string;
  headers: Partial<Record<THttpHeaders, string>>;
  body: TRequestBody;
  query: Record<string, string>;
  params: Record<string, string>;

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
export type TResponseBody<T = unknown> = T;

/**
 * Represents the response object
 *
 * This is the response object that is sent to the client.
 */
export interface IResponse {
  statusCode: THttpStatusCode;
  status: THttpStatus;
  headers: Partial<Record<THttpHeaders, string>>;
  body: TResponseBody;
}

/**
 * Represents a route handler function that returns a response body
 *
 * This type defines the signature for route handlers that process requests
 * and return a response. The function can return either a promise that resolves
 * to a response body or a response body directly.
 *
 * @param ctx - The request context containing request and response objects
 * @returns A response body or a promise that resolves to a response body
 */
export type TResponseFunction = (ctx: IContext) => Promise<TResponseBody> | TResponseBody;

/**
 * Represents a route handler function that may or may not return a response body
 *
 * This type extends TResponseFunction to also allow handlers that don't return
 * anything (void). This is useful for hook functions that may modify the
 * request or response but don't need to return a response body themselves.
 *
 * @param ctx - The request context containing request and response objects
 * @returns A response body, a promise that resolves to a response body, void, or a promise that resolves to void
 */
export type TUndefinableResponseFunction = TResponseFunction | ((ctx: IContext) => Promise<void> | void);
