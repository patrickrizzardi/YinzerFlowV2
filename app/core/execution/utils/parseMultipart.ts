import type { ContentDispositionResolved, FileUploadResolved, MultipartFormDataResolved } from '@typedefs/internal/RequestResolved.ts';

/**
 * Split a multipart section into headers and content
 *
 * @example
 * ```ts
 * splitMultipartSection('Content-Disposition: form-data; name="file"; filename="example.txt"\r\nContent-Type: text/plain\r\n\r\nThis is the content of the file.\r\n');
 * // Returns ['Content-Disposition: form-data; name="file"; filename="example.txt"\r\nContent-Type: text/plain\r\n', 'This is the content of the file.\r\n']
 * ```
 */
const splitMultipartSection = (section: string): [string, string] => {
  const trimmedSection = section.startsWith('\r\n') ? section.slice(2) : section;
  const headerEndIndex = trimmedSection.indexOf('\r\n\r\n');

  if (headerEndIndex === -1) {
    return ['', ''];
  }

  const headers = trimmedSection.slice(0, headerEndIndex);
  const content = trimmedSection.slice(headerEndIndex + 4);
  return [headers, content];
};

/**
 * Simple Content-Disposition parser for multipart sections
 *
 * @example
 * ```ts
 * parseContentDisposition('Content-Disposition: form-data; name="file"; filename="example.txt"\r\nContent-Type: text/plain\r\n\r\nThis is the content of the file.\r\n');
 * // Returns { name: 'file', filename: 'example.txt' }
 * ```
 */
const parseContentDisposition = (headerLine: string): ContentDispositionResolved => {
  const result: ContentDispositionResolved = { name: '' };

  const nameMatch = /name=(?:"(?<temp2>[^"]*)"|(?<temp1>[^;,\s]+))/i.exec(headerLine);
  const filenameMatch = /filename=(?:"(?<temp2>[^"]*)"|(?<temp1>[^;,\s]+))/i.exec(headerLine);

  if (nameMatch) {
    result.name = nameMatch[1] ?? nameMatch[2] ?? '';
  }

  if (filenameMatch) {
    const filename = filenameMatch[1] ?? filenameMatch[2];
    if (filename) {
      result.filename = filename;
    }
  }

  return result;
};

/**
 * Extract Content-Type from multipart section headers
 *
 * @example
 * ```ts
 * extractSectionContentType('Content-Type: text/plain\r\n\r\nThis is the content of the file.\r\n');
 * // Returns 'text/plain'
 * ```
 */
const extractSectionContentType = (headers: string): string => {
  const lines = headers.split(/\r?\n/);
  const contentTypeLine = lines.find((line) => line.toLowerCase().startsWith('content-type:'));

  if (!contentTypeLine) return 'application/octet-stream';

  return (
    contentTypeLine
      .slice(contentTypeLine.indexOf(':') + 1)
      .trim()
      .split(';')[0]
      ?.trim() ?? 'application/octet-stream'
  );
};

/**
 * Determine if content should be treated as binary
 *
 * @example
 * ```ts
 * isBinaryContent('image/png');
 * // Returns true
 * ```
 */
const isBinaryContent = (contentTypeValue: string): boolean => {
  const binaryTypes = ['image/', 'audio/', 'video/', 'application/octet-stream', 'application/pdf', 'application/zip', 'application/x-'];

  return binaryTypes.some((type) => contentTypeValue.toLowerCase().startsWith(type));
};

/**
 * Calculate content length for string or Buffer
 *
 * @example
 * ```ts
 * calculateContentLength('Hello, world!');
 * // Returns 13
 * ```
 */
const calculateContentLength = (content: Buffer | string): number => (Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content, 'utf8'));

/**
 * Handle file upload processing with binary support
 *
 * @example
 * ```ts
 * handleFileUpload({
 *   contentDisposition: { name: 'file', filename: 'example.txt' },
 *   contentSection: 'This is the content of the file.\r\n',
 */
const handleFileUpload = ({
  contentDisposition,
  contentSection,
  headersSection,
}: {
  contentDisposition: ContentDispositionResolved;
  contentSection: string;
  headersSection: string;
}): FileUploadResolved => {
  const contentTypeValue = extractSectionContentType(headersSection);

  // Remove trailing \r\n that's part of the multipart boundary
  const trimmedContent = contentSection.endsWith('\r\n') ? contentSection.slice(0, -2) : contentSection;

  // For binary files, convert string to Buffer
  const content: Buffer | string = isBinaryContent(contentTypeValue) ? Buffer.from(trimmedContent, 'binary') : trimmedContent;

  return {
    filename: contentDisposition.filename ?? '',
    contentType: contentTypeValue,
    size: calculateContentLength(content),
    content,
  };
};

/**
 * Parse multipart form data request body with binary file support
 *
 * @example
 * ```ts
 * parseMultipartFormData('Content-Disposition: form-data; name="file"; filename="example.txt"\r\nContent-Type: text/plain\r\n\r\nThis is the content of the file.\r\n', 'boundary');
 * // Returns { fields: { file: 'This is the content of the file.\r\n' }, files: [{ filename: 'example.txt', contentType: 'text/plain', size: 13, content: 'This is the content of the file.\r\n' }] }
 * ```
 */
export const parseMultipartFormData = (body: string, boundary: string): MultipartFormDataResolved => {
  const result: MultipartFormDataResolved = {
    fields: {},
    files: [],
  };

  // Split the body into parts using the boundary
  const parts = body.split(`--${boundary}`).slice(1); // Skip the first empty part

  for (const part of parts) {
    // Skip empty parts and the final boundary marker
    if (!part || part.trim() === '' || part.trim() === '--') continue;

    // Parse the part headers and content
    const [headersSection, contentSection] = splitMultipartSection(part);
    if (!headersSection) continue; // Skip malformed parts

    // Find Content-Disposition header
    const lines = headersSection.split(/\r?\n/);
    const dispositionLine = lines.find((line) => line.toLowerCase().startsWith('content-disposition:'));
    if (!dispositionLine) continue;

    const contentDisposition = parseContentDisposition(dispositionLine);
    if (!contentDisposition.name) continue;

    // Handle file upload
    if (contentDisposition.filename !== undefined) {
      const file = handleFileUpload({
        contentDisposition,
        contentSection,
        headersSection,
      });
      result.files.push(file);
    }

    // Handle regular form field
    if (contentDisposition.filename === undefined) {
      // Remove trailing \r\n that's part of the multipart boundary
      const trimmedContent = contentSection.endsWith('\r\n') ? contentSection.slice(0, -2) : contentSection;
      result.fields[contentDisposition.name] = trimmedContent;
    }
  }

  return result;
};
