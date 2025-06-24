import { describe, expect, it } from 'bun:test';
import { RequestBuilder } from '@core/execution/RequestBuilder.ts';
import { Setup } from '@core/setup/Setup.ts';
import type { THttpMethod } from '@typedefs/constants/http.js';

describe('RequestBuilder', () => {
  const createMockSetup = (config = {}) => {
    return new Setup(config);
  };

  const createRawRequest = (requestString: string) => Buffer.from(requestString);

  describe('Integration and orchestration', () => {
    it('should orchestrate all parsing utilities correctly', () => {
      const rawRequest = createRawRequest(
        'GET /users/123?include=profile HTTP/1.1\r\nHost: api.example.com\r\nContent-Type: application/json\r\n\r\n{"test": "data"}',
      );
      const setup = new Setup();
      const requestBuilder = new RequestBuilder(rawRequest, setup);
      const request = requestBuilder.getRequest();

      // Verify all components are integrated
      expect(request.method).toBe('GET');
      expect(request.path).toBe('/users/123?include=profile');
      expect(request.protocol).toBe('HTTP/1.1');
      expect(request.headers.host).toBe('api.example.com');
      expect(request.query).toEqual({ include: 'profile' });
      expect(request.body).toEqual({ test: 'data' });
      expect(request.params).toEqual({});
      expect(request.ipAddress).toBe('');
    });

    it('should handle rawBody configuration correctly', () => {
      const jsonBody = '{"name": "John", "age": 30}';
      const rawRequest = createRawRequest(`POST /users HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\n\r\n${jsonBody}`);

      const setupWithRawBody = new Setup({ rawBody: true });
      const requestBuilder = new RequestBuilder(rawRequest, setupWithRawBody);
      const request = requestBuilder.getRequest();

      expect(request.body).toBe(jsonBody); // Raw string, not parsed JSON
    });

    it('should handle parsed body when rawBody is false', () => {
      const jsonBody = '{"name": "John", "age": 30}';
      const rawRequest = createRawRequest(`POST /users HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\n\r\n${jsonBody}`);

      const setup = new Setup({ rawBody: false });
      const requestBuilder = new RequestBuilder(rawRequest, setup);
      const request = requestBuilder.getRequest();

      expect(request.body).toEqual({ name: 'John', age: 30 }); // Parsed JSON
    });
  });

  describe('Route integration', () => {
    it('should extract route parameters when route matches', () => {
      const rawRequest = createRawRequest('GET /users/123/posts/456 HTTP/1.1\r\nHost: example.com\r\n\r\n');
      const setup = new Setup();

      // Register a route to test parameter extraction
      setup.get('/users/:userId/posts/:postId', () => ({}));

      const requestBuilder = new RequestBuilder(rawRequest, setup);
      const request = requestBuilder.getRequest();

      expect(request.params).toEqual({
        userId: '123',
        postId: '456',
      });
    });

    it('should have empty params when no route matches', () => {
      const rawRequest = createRawRequest('GET /unknown/path HTTP/1.1\r\nHost: example.com\r\n\r\n');
      const setup = new Setup();
      const requestBuilder = new RequestBuilder(rawRequest, setup);
      const request = requestBuilder.getRequest();

      expect(request.params).toEqual({});
    });
  });

  describe('Configuration integration', () => {
    it('should use proxy configuration for IP extraction', () => {
      const rawRequest = createRawRequest('GET /test HTTP/1.1\r\nHost: example.com\r\nX-Forwarded-For: 203.0.113.1, 192.168.1.100\r\n\r\n');

      const setupWithProxy = new Setup({ proxyHops: 1 });
      const requestBuilder = new RequestBuilder(rawRequest, setupWithProxy);
      const request = requestBuilder.getRequest();

      expect(request.ipAddress).toBe('192.168.1.100');
    });

    it('should handle no proxy configuration', () => {
      const rawRequest = createRawRequest('GET /test HTTP/1.1\r\nHost: example.com\r\nX-Forwarded-For: 203.0.113.1, 192.168.1.100\r\n\r\n');

      const setup = new Setup({ proxyHops: 0 });
      const requestBuilder = new RequestBuilder(rawRequest, setup);
      const request = requestBuilder.getRequest();

      expect(request.ipAddress).toBe('203.0.113.1, 192.168.1.100');
    });
  });

  describe('Content-Type and boundary extraction', () => {
    it('should extract content type and pass to body parser', () => {
      const rawRequest = createRawRequest(
        'POST /upload HTTP/1.1\r\nContent-Type: multipart/form-data; boundary=test123\r\n\r\n--test123\r\nContent-Disposition: form-data; name="field"\r\n\r\nvalue\r\n--test123--',
      );
      const setup = new Setup();
      const requestBuilder = new RequestBuilder(rawRequest, setup);
      const request = requestBuilder.getRequest();

      // Should be parsed as multipart (has fields and files properties)
      expect(request.body).toHaveProperty('fields');
      expect(request.body).toHaveProperty('files');
    });

    it('should handle content type with parameters', () => {
      const rawRequest = createRawRequest('POST /api HTTP/1.1\r\nContent-Type: application/json; charset=utf-8\r\n\r\n{"test": true}');
      const setup = new Setup();
      const requestBuilder = new RequestBuilder(rawRequest, setup);
      const request = requestBuilder.getRequest();

      expect(request.body).toEqual({ test: true });
    });
  });

  describe('Error handling', () => {
    it('should throw error for invalid HTTP methods', () => {
      const rawRequest = createRawRequest('INVALID /test HTTP/1.1\r\nHost: example.com\r\n\r\n');
      const setup = new Setup();

      expect(() => new RequestBuilder(rawRequest, setup)).toThrow('Invalid HTTP method: INVALID');
    });
  });

  describe('RequestBuilder interface', () => {
    it('should implement IRequestBuilder interface correctly', () => {
      const rawRequest = createRawRequest('GET / HTTP/1.1\r\nHost: localhost\r\n\r\n');
      const setup = new Setup();
      const requestBuilder = new RequestBuilder(rawRequest, setup);

      expect(typeof requestBuilder.getRequest).toBe('function');
      expect(requestBuilder.getRequest()).toBeDefined();
    });

    it('should return the same request object on multiple calls', () => {
      const rawRequest = createRawRequest('GET / HTTP/1.1\r\nHost: localhost\r\n\r\n');
      const setup = new Setup();
      const requestBuilder = new RequestBuilder(rawRequest, setup);

      const request1 = requestBuilder.getRequest();
      const request2 = requestBuilder.getRequest();

      expect(request1).toBe(request2); // Same reference
    });
  });
});
