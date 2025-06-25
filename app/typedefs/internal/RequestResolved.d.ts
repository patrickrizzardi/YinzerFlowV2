/**
 * Represents multipart form data with file uploads
 *
 * This interface is used for handling form submissions that include file uploads.
 * It separates regular form fields from uploaded files for easier processing.
 */
export interface MultipartFormDataResolved {
  /** Regular form fields as key-value pairs */
  fields: Record<string, string>;
  /** Uploaded files indexed by field name */
  files: Array<FileUploadResolved>;
}

export interface FileUploadResolved {
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

export interface ContentDispositionResolved {
  name: string;
  filename?: string;
}
