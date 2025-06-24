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

    it('should handle complex nested JSON', () => {
      const body = '{"users": [{"name": "John", "settings": {"theme": "dark"}}]}';
      const result = parseBody(body, contentType.json);

      expect(result).toEqual({
        users: [{ name: 'John', settings: { theme: 'dark' } }],
      });
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

    it('should handle multipart with multiple fields and files', () => {
      const boundary = 'boundary123';
      const body = `--${boundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\nJohn\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="data.txt"\r\nContent-Type: text/plain\r\n\r\nfile data\r\n--${boundary}--`;

      const result = parseBody(body, contentType.multipart, boundary);

      expect((result as any).fields.name).toBe('John');
      expect((result as any).files).toHaveLength(1);
      expect((result as any).files[0].filename).toBe('data.txt');
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

    it('should handle empty values in URL-encoded data', () => {
      const body = 'empty=&hasvalue=test';
      const result = parseBody(body, contentType.form);

      expect(result).toEqual({
        empty: '',
        hasvalue: 'test',
      });
    });

    it('should handle complex URL-encoded data', () => {
      const body = 'user%5Bname%5D=John&user%5Bemail%5D=john%40example.com&tags%5B%5D=dev&tags%5B%5D=js';
      const result = parseBody(body, contentType.form);

      expect(result).toEqual({
        'user[name]': 'John',
        'user[email]': 'john@example.com',
        'tags[]': 'js', // Last value wins (depends on URL parsing implementation)
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

    it('should handle binary-like content as raw text', () => {
      const body = 'Binary\x00\x01\x02data';
      const result = parseBody(body, 'application/octet-stream' as any);

      expect(result).toBe(body);
    });
  });

  describe('Integration with content type inference', () => {
    it('should use inferContentType when no content type provided', () => {
      // JSON inference and parsing
      const jsonBody = '{"inferred": true}';
      const jsonResult = parseBody(jsonBody);
      expect(jsonResult).toEqual({ inferred: true });

      // Form data inference and parsing
      const formBody = 'key=value&test=123';
      const formResult = parseBody(formBody);
      expect(formResult).toEqual({ key: 'value', test: '123' });

      // Plain text fallback
      const textBody = 'Just plain text';
      const textResult = parseBody(textBody);
      expect(textResult).toBe(textBody);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle content type with parameters gracefully', () => {
      const body = '{"test": true}';
      const result = parseBody(body, 'application/json; charset=utf-8' as any);

      // Since parseBody expects just the main content type, this should not match exactly
      // It should fall back to returning raw body since the content-type doesn't match exactly
      expect(result).toBe('{"test": true}');
    });

    it('should handle very large content', () => {
      const largeContent = 'x'.repeat(10000);
      const result = parseBody(largeContent, 'text/plain');

      expect(result).toBe(largeContent);
    });

    it('should handle malformed data gracefully', () => {
      // Malformed JSON should throw with explicit content-type
      expect(() => parseBody('{"invalid": json}', contentType.json)).toThrow();

      // But should return raw with inference
      const result = parseBody('{"invalid": json}');
      expect(result).toBe('{"invalid": json}');
    });
  });
});
