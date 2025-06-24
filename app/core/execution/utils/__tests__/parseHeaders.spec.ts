import { describe, expect, it } from 'bun:test';
import { parseHeaders } from '../parseHeaders.ts';

describe('parseHeaders', () => {
  describe('Basic header parsing', () => {
    it('should parse simple headers', () => {
      const rawHeaders = 'Host: example.com\r\nUser-Agent: test-browser\r\nAccept: application/json';
      const result = parseHeaders(rawHeaders);

      expect(result).toEqual({
        host: 'example.com',
        'user-agent': 'test-browser',
        accept: 'application/json',
      });
    });

    it('should parse single header', () => {
      const rawHeaders = 'Content-Type: application/json';
      const result = parseHeaders(rawHeaders);

      expect(result).toEqual({
        'content-type': 'application/json',
      });
    });

    it('should handle empty headers', () => {
      const rawHeaders = '';
      const result = parseHeaders(rawHeaders);

      expect(result).toEqual({});
    });

    it('should handle headers with multiple values', () => {
      const rawHeaders = 'Accept: text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8\r\nAccept-Language: en-US,en;q=0.5';
      const result = parseHeaders(rawHeaders);

      expect(result).toEqual({
        accept: 'text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8',
        'accept-language': 'en-US,en;q=0.5',
      });
    });
  });

  describe('Header normalization', () => {
    it('should normalize header names to lowercase', () => {
      const rawHeaders = 'HOST: example.com\r\nUSER-AGENT: test\r\nContent-Type: application/json';
      const result = parseHeaders(rawHeaders);

      expect(result).toEqual({
        host: 'example.com',
        'user-agent': 'test',
        'content-type': 'application/json',
      });
    });

    it('should handle mixed case headers', () => {
      const rawHeaders = 'Content-LENGTH: 123\r\nX-Custom-Header: value\r\nauthorization: Bearer token';
      const result = parseHeaders(rawHeaders);

      expect(result).toEqual({
        'content-length': '123',
        'x-custom-header': 'value',
        authorization: 'Bearer token',
      });
    });

    it('should trim whitespace around header values', () => {
      const rawHeaders = 'Host:   example.com   \r\nUser-Agent:test\r\nContent-Type:  application/json  ';
      const result = parseHeaders(rawHeaders);

      expect(result).toEqual({
        host: 'example.com',
        'user-agent': 'test',
        'content-type': 'application/json',
      });
    });

    it('should trim whitespace around header names', () => {
      const rawHeaders = '  Host  : example.com\r\n User-Agent : test\r\n  Content-Type  :application/json';
      const result = parseHeaders(rawHeaders);

      expect(result).toEqual({
        host: 'example.com',
        'user-agent': 'test',
        'content-type': 'application/json',
      });
    });
  });

  describe('Line ending handling', () => {
    it('should handle CRLF line endings', () => {
      const rawHeaders = 'Host: example.com\r\nUser-Agent: test\r\nAccept: application/json';
      const result = parseHeaders(rawHeaders);

      expect(result).toEqual({
        host: 'example.com',
        'user-agent': 'test',
        accept: 'application/json',
      });
    });

    it('should handle mixed line endings', () => {
      const rawHeaders = 'Host: example.com\r\nUser-Agent: test\nAccept: application/json\rContent-Type: application/json';
      const result = parseHeaders(rawHeaders);

      expect(result).toEqual({
        host: 'example.com',
        'user-agent': 'test',
        accept: 'application/json',
        'content-type': 'application/json',
      });
    });
  });

  describe('Standard HTTP headers', () => {
    it('should handle common request headers', () => {
      const rawHeaders = [
        'Host: api.example.com',
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept: application/json, text/plain, */*',
        'Accept-Language: en-US,en;q=0.9',
        'Accept-Encoding: gzip, deflate, br',
        'Connection: keep-alive',
        'Content-Type: application/json',
        'Content-Length: 123',
        'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        'Cache-Control: no-cache',
      ].join('\r\n');

      const result = parseHeaders(rawHeaders);

      expect(result).toEqual({
        host: 'api.example.com',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        accept: 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9',
        'accept-encoding': 'gzip, deflate, br',
        connection: 'keep-alive',
        'content-type': 'application/json',
        'content-length': '123',
        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        'cache-control': 'no-cache',
      });
    });

    it('should handle custom headers', () => {
      const rawHeaders = ['X-API-Key: secret123', 'X-Request-ID: req-12345', 'X-Forwarded-For: 192.168.1.1', 'X-Custom-Header: custom-value'].join('\r\n');

      const result = parseHeaders(rawHeaders);

      expect(result).toEqual({
        'x-api-key': 'secret123',
        'x-request-id': 'req-12345',
        'x-forwarded-for': '192.168.1.1',
        'x-custom-header': 'custom-value',
      });
    });
  });

  describe('Edge cases and malformed headers', () => {
    it('should skip headers without colons', () => {
      const rawHeaders = 'Valid-Header: value\r\nInvalidHeaderNoColon\r\nAnother-Valid: value2';
      const result = parseHeaders(rawHeaders);

      expect(result).toEqual({
        'valid-header': 'value',
        'another-valid': 'value2',
      });
    });

    it('should skip empty header names', () => {
      const rawHeaders = 'Valid-Header: value\r\n: empty-name\r\nAnother-Valid: value2';
      const result = parseHeaders(rawHeaders);

      expect(result).toEqual({
        'valid-header': 'value',
        'another-valid': 'value2',
      });
    });

    it('should handle headers with empty values', () => {
      const rawHeaders = 'Empty-Value:\r\nAnother-Empty: \r\nValid-Header: value';
      const result = parseHeaders(rawHeaders);

      expect(result).toEqual({
        'empty-value': '',
        'another-empty': '',
        'valid-header': 'value',
      });
    });

    it('should handle headers with multiple colons', () => {
      const rawHeaders = 'Authorization: Bearer: token:with:colons\r\nTime: 12:34:56\r\nURL: https://example.com:8080';
      const result = parseHeaders(rawHeaders);

      expect(result).toEqual({
        authorization: 'Bearer: token:with:colons',
        time: '12:34:56',
        url: 'https://example.com:8080',
      });
    });

    it('should skip empty lines', () => {
      const rawHeaders = 'Header1: value1\r\n\r\nHeader2: value2\r\n\r\n\r\nHeader3: value3';
      const result = parseHeaders(rawHeaders);

      expect(result).toEqual({
        header1: 'value1',
        header2: 'value2',
        header3: 'value3',
      });
    });

    it('should handle duplicate header names (last one wins)', () => {
      const rawHeaders = 'Set-Cookie: first=value1\r\nContent-Type: text/html\r\nSet-Cookie: second=value2';
      const result = parseHeaders(rawHeaders);

      expect(result).toEqual({
        'set-cookie': 'second=value2',
        'content-type': 'text/html',
      });
    });
  });

  describe('Special header values', () => {
    it('should handle headers with special characters', () => {
      const rawHeaders = [
        'Accept: application/json, text/plain; charset=utf-8',
        'Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=',
        'Content-Disposition: attachment; filename="test file.pdf"',
        'Set-Cookie: session=abc123; Path=/; HttpOnly; Secure',
      ].join('\r\n');

      const result = parseHeaders(rawHeaders);

      expect(result).toEqual({
        accept: 'application/json, text/plain; charset=utf-8',
        authorization: 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=',
        'content-disposition': 'attachment; filename="test file.pdf"',
        'set-cookie': 'session=abc123; Path=/; HttpOnly; Secure',
      });
    });

    it('should handle headers with unicode characters', () => {
      const rawHeaders = 'X-Custom-Message: Hello 🌍\r\nX-Unicode: 中文测试';
      const result = parseHeaders(rawHeaders);

      expect(result).toEqual({
        'x-custom-message': 'Hello 🌍',
        'x-unicode': '中文测试',
      });
    });
  });
});
