import { describe, expect, it } from 'bun:test';
import { RequestBuilder } from '@core/execution/RequestBuilder.ts';
import { Setup } from '@core/setup/Setup.ts';

describe('RequestBuilder', () => {
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

  describe('RawBody configuration hierarchy', () => {
    it('should use route-level rawBody when route specifies true, overriding setup false', () => {
      const jsonBody = '{"name": "John", "age": 30}';
      const rawRequest = createRawRequest(`POST /api/upload HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\n\r\n${jsonBody}`);

      const setup = new Setup({ rawBody: false }); // Setup says parse the body

      // Register route with rawBody: true (should override setup)
      setup.post('/api/upload', () => ({}), { rawBody: true });

      const requestBuilder = new RequestBuilder(rawRequest, setup);
      const request = requestBuilder.getRequest();

      expect(request.body).toBe(jsonBody); // Should be raw string, not parsed JSON
    });

    it('should use route-level rawBody when route specifies false, overriding setup true', () => {
      const jsonBody = '{"name": "John", "age": 30}';
      const rawRequest = createRawRequest(`POST /api/process HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\n\r\n${jsonBody}`);

      const setup = new Setup({ rawBody: true }); // Setup says keep raw body

      // Register route with rawBody: false (should override setup)
      setup.post('/api/process', () => ({}), { rawBody: false });

      const requestBuilder = new RequestBuilder(rawRequest, setup);
      const request = requestBuilder.getRequest();

      expect(request.body).toEqual({ name: 'John', age: 30 }); // Should be parsed JSON, not raw string
    });

    it('should fallback to setup rawBody when route does not specify rawBody option', () => {
      const jsonBody = '{"name": "John", "age": 30}';
      const rawRequest = createRawRequest(`POST /api/fallback HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\n\r\n${jsonBody}`);

      const setup = new Setup({ rawBody: true });

      // Register route without rawBody option (should use setup config)
      setup.post('/api/fallback', () => ({}));

      const requestBuilder = new RequestBuilder(rawRequest, setup);
      const request = requestBuilder.getRequest();

      expect(request.body).toBe(jsonBody); // Should use setup's rawBody: true
    });

    it('should fallback to setup rawBody when route options exist but rawBody is undefined', () => {
      const jsonBody = '{"name": "John", "age": 30}';
      const rawRequest = createRawRequest(`POST /api/hooks HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\n\r\n${jsonBody}`);

      const setup = new Setup({ rawBody: false });

      // Register route with options but no rawBody specified
      setup.post('/api/hooks', () => ({}), {
        beforeHooks: [],
        afterHooks: [],
        // rawBody is undefined, should fallback to setup
      });

      const requestBuilder = new RequestBuilder(rawRequest, setup);
      const request = requestBuilder.getRequest();

      expect(request.body).toEqual({ name: 'John', age: 30 }); // Should use setup's rawBody: false (parsed)
    });

    it('should work with different content types and route-level rawBody', () => {
      const formBody = 'name=John+Doe&email=john%40example.com';
      const rawRequest = createRawRequest(`POST /api/form HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/x-www-form-urlencoded\r\n\r\n${formBody}`);

      const setup = new Setup({ rawBody: false });

      // Route specifies rawBody: true for form data
      setup.post('/api/form', () => ({}), { rawBody: true });

      const requestBuilder = new RequestBuilder(rawRequest, setup);
      const request = requestBuilder.getRequest();

      expect(request.body).toBe(formBody); // Should be raw string, not parsed form object
    });

    it('should handle route-level rawBody with multipart data', () => {
      const multipartBody = '--test123\r\nContent-Disposition: form-data; name="field"\r\n\r\nvalue\r\n--test123--';
      const rawRequest = createRawRequest(
        `POST /api/upload HTTP/1.1\r\nHost: localhost\r\nContent-Type: multipart/form-data; boundary=test123\r\n\r\n${multipartBody}`,
      );

      const setup = new Setup({ rawBody: false });

      // Route specifies rawBody: true for multipart
      setup.post('/api/upload', () => ({}), { rawBody: true });

      const requestBuilder = new RequestBuilder(rawRequest, setup);
      const request = requestBuilder.getRequest();

      expect(request.body).toBe(multipartBody); // Should be raw string, not parsed multipart object
    });

    it('should handle unmatched routes with setup rawBody configuration', () => {
      const jsonBody = '{"test": "data"}';
      const rawRequest = createRawRequest(`POST /unknown/route HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\n\r\n${jsonBody}`);

      const setup = new Setup({ rawBody: true });
      // No route registered for /unknown/route

      const requestBuilder = new RequestBuilder(rawRequest, setup);
      const request = requestBuilder.getRequest();

      expect(request.body).toBe(jsonBody); // Should use setup's rawBody: true since no route found
      expect(request.params).toEqual({}); // No route match
    });

    it('should handle group-level rawBody options', () => {
      const jsonBody = '{"groupTest": "data"}';
      const rawRequest = createRawRequest(`POST /api/v1/test HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\n\r\n${jsonBody}`);

      const setup = new Setup({ rawBody: false });

      // Register a group with rawBody option
      setup.group(
        '/api/v1',
        (group) => {
          group.post('/test', () => ({}));
        },
        { rawBody: true },
      );

      const requestBuilder = new RequestBuilder(rawRequest, setup);
      const request = requestBuilder.getRequest();

      expect(request.body).toBe(jsonBody); // Should use group's rawBody: true
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
