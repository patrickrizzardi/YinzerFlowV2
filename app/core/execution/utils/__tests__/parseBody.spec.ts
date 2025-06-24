import { describe, expect, it } from 'bun:test';
import { parseBody } from '../parseBody.ts';
import { contentType } from '@constants/http.ts';

describe('parseBody', () => {
  describe('Empty body handling', () => {
    it('should return undefined for empty string', () => {
      const result = parseBody('');
      expect(result).toBeUndefined();
    });

    it('should return undefined for whitespace-only string', () => {
      const result = parseBody('   ');
      expect(result).toBeUndefined();
    });
  });

  describe('JSON parsing', () => {
    it('should parse JSON when content type is application/json', () => {
      const body = '{"name": "test", "value": 123}';
      const result = parseBody(body, contentType.json);

      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('should parse JSON arrays when content type is application/json', () => {
      const body = '[1, 2, 3, "test"]';
      const result = parseBody(body, contentType.json);

      expect(result).toEqual([1, 2, 3, 'test'] as any);
    });

    it('should throw error for invalid JSON with json content type', () => {
      const body = '{"invalid": json}';

      expect(() => parseBody(body, contentType.json)).toThrow('Invalid JSON');
    });

    it('should infer and parse JSON from object-like body', () => {
      const body = '{"inferred": true}';
      const result = parseBody(body); // No content type provided

      expect(result).toEqual({ inferred: true });
    });

    it('should infer and parse JSON from array-like body', () => {
      const body = '["inferred", "array"]';
      const result = parseBody(body); // No content type provided

      expect(result).toEqual(['inferred', 'array'] as any);
    });

    it('should return raw body if JSON inference fails', () => {
      const body = '{"looks": "like json but is not}';
      const result = parseBody(body); // No content type, inference fails

      expect(result).toBe(body);
    });
  });

  describe('Multipart form data parsing', () => {
    it('should parse multipart data with boundary', () => {
      const boundary = 'boundary123';
      const body = `--${boundary}\r\nContent-Disposition: form-data; name="field1"\r\n\r\nvalue1\r\n--${boundary}--`;

      const result = parseBody(body, contentType.multipart, boundary);

      expect(result).toHaveProperty('fields');
      expect(result).toHaveProperty('files');
      expect((result as any).fields.field1).toBe('value1');
    });

    it('should throw error for multipart without boundary', () => {
      const body = '--boundary123\r\nContent-Disposition: form-data; name="field1"\r\n\r\nvalue1\r\n--boundary123--';

      expect(() => parseBody(body, contentType.multipart)).toThrow('Invalid multipart form data: missing boundary');
    });

    it('should handle multipart with file uploads', () => {
      const boundary = 'boundary123';
      const body = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.txt"\r\nContent-Type: text/plain\r\n\r\nfile content\r\n--${boundary}--`;

      const result = parseBody(body, contentType.multipart, boundary);

      expect(result).toHaveProperty('files');
      expect((result as any).files).toHaveLength(1);
      expect((result as any).files[0].filename).toBe('test.txt');
      expect((result as any).files[0].content).toBe('file content');
    });
  });

  describe('URL-encoded form parsing', () => {
    it('should parse URL-encoded form data', () => {
      const body = 'name=test&value=123&encoded=%20space';
      const result = parseBody(body, contentType.form);

      expect(result).toEqual({
        name: 'test',
        value: '123',
        encoded: ' space',
      });
    });

    it('should infer URL-encoded from body content', () => {
      const body = 'key=value&another=test';
      const result = parseBody(body); // No content type provided

      expect(result).toEqual({
        key: 'value',
        another: 'test',
      });
    });

    it('should handle empty values in URL-encoded data', () => {
      const body = 'empty=&hasvalue=test';
      const result = parseBody(body, contentType.form);

      expect(result).toEqual({
        empty: '',
        hasvalue: 'test',
      });
    });
  });

  describe('Raw body handling', () => {
    it('should return raw body for text content types', () => {
      const body = 'This is plain text content';
      const result = parseBody(body, 'text/plain');

      expect(result).toBe(body);
    });

    it('should return raw body for unknown content types', () => {
      const body = 'Some unknown content';
      const result = parseBody(body, 'application/unknown' as any);

      expect(result).toBe(body);
    });

    it('should return raw body when no patterns match inference', () => {
      const body = 'Just some random text';
      const result = parseBody(body); // No content type, no patterns match

      expect(result).toBe(body);
    });
  });

  describe('Content type inference', () => {
    it('should infer json for object-like content', () => {
      const body = '{"test": true}';
      const result = parseBody(body);

      expect(result).toEqual({ test: true });
    });

    it('should infer json for array-like content', () => {
      const body = '[1, 2, 3]';
      const result = parseBody(body);

      expect(result).toEqual([1, 2, 3] as any);
    });

    it('should infer form data for key=value patterns', () => {
      const body = 'key=value&test=123';
      const result = parseBody(body);

      expect(result).toEqual({ key: 'value', test: '123' });
    });

    it('should default to raw text for unrecognized patterns', () => {
      const body = 'Random text content';
      const result = parseBody(body);

      expect(result).toBe(body);
    });
  });

  describe('Edge cases', () => {
    it('should handle content type with parameters', () => {
      // This should be handled by RequestBuilder, but testing the direct case
      const body = '{"test": true}';
      const result = parseBody(body, 'application/json; charset=utf-8' as any);

      // Since parseBody expects just the main content type, this should not match
      expect(result).toBe(body); // Returns raw since it doesn't match exactly
    });

    it('should handle malformed JSON gracefully in inference', () => {
      const body = '{"looks": "like json" but invalid}';
      const result = parseBody(body);

      expect(result).toBe(body); // Should return raw body when JSON parsing fails
    });

    it('should handle very large content', () => {
      const largeContent = 'x'.repeat(10000);
      const result = parseBody(largeContent, 'text/plain');

      expect(result).toBe(largeContent);
    });
  });
});
