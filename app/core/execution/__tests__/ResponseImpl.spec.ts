import { beforeEach, describe, expect, it } from 'bun:test';
import { ResponseImpl } from '../ResponseImpl.ts';
import { RequestImpl } from '../RequestImpl.ts';
import { SetupImpl } from '@core/setup/SetupImpl.ts';
import { httpStatus, httpStatusCode } from '@constants/http.ts';
import type { Request } from '@typedefs/public/Request.ts';
import type { THttpHeaders } from '@typedefs/constants/http.js';

// Test data builders
const createTestRequest = (requestString = 'GET / HTTP/1.1\r\nHost: localhost\r\n\r\n'): Request => {
  return new RequestImpl(Buffer.from(requestString), new SetupImpl());
};

describe('ResponseImpl', () => {
  let request: Request;
  let response: ResponseImpl;

  beforeEach(() => {
    request = createTestRequest();
    response = new ResponseImpl(request);
  });

  describe('constructor initialization', () => {
    it('should initialize with default values', () => {
      expect(response._request).toBe(request);
      expect(response._statusCode).toBe(httpStatusCode.ok);
      expect(response._status).toBe(httpStatus.ok);
      expect(response._headers).toEqual({});
      expect(response._body).toBe('');
    });

    it('should maintain reference to original request', () => {
      const customRequest = createTestRequest('POST /api HTTP/1.1\r\nHost: localhost\r\n\r\n');
      const customResponse = new ResponseImpl(customRequest);

      expect(customResponse._request).toBe(customRequest);
      expect(customResponse._request.method).toBe('POST');
      expect(customResponse._request.path).toBe('/api');
    });
  });

  describe('setStatusCode', () => {
    const statusTestCases = [
      { code: httpStatusCode.ok, expectedStatus: httpStatus.ok },
      { code: httpStatusCode.created, expectedStatus: httpStatus.created },
      { code: httpStatusCode.badRequest, expectedStatus: httpStatus.badRequest },
      { code: httpStatusCode.notFound, expectedStatus: httpStatus.notFound },
      { code: httpStatusCode.internalServerError, expectedStatus: httpStatus.internalServerError },
    ];

    statusTestCases.forEach(({ code, expectedStatus }) => {
      it(`should set status code ${code} and corresponding status message`, () => {
        response.setStatusCode(code);

        expect(response._statusCode).toBe(code);
        expect(response._status).toBe(expectedStatus);
      });
    });

    it('should update status when called multiple times', () => {
      response.setStatusCode(httpStatusCode.created);
      expect(response._statusCode).toBe(httpStatusCode.created);

      response.setStatusCode(httpStatusCode.badRequest);
      expect(response._statusCode).toBe(httpStatusCode.badRequest);
      expect(response._status).toBe(httpStatus.badRequest);
    });
  });

  describe('addHeaders', () => {
    it('should add single header', () => {
      response.addHeaders({ 'content-type': 'application/json' });

      expect(response._headers['content-type']).toBe('application/json');
    });

    it('should add multiple headers at once', () => {
      const headers = {
        'content-type': 'text/html',
        'cache-control': 'no-cache',
        authorization: 'Bearer token123',
      };

      response.addHeaders(headers);

      expect(response._headers['content-type']).toBe('text/html');
      expect(response._headers['cache-control']).toBe('no-cache');
      expect(response._headers.authorization).toBe('Bearer token123');
    });

    it('should overwrite existing headers', () => {
      response.addHeaders({ 'content-type': 'application/json' });
      response.addHeaders({ 'content-type': 'text/plain' });

      expect(response._headers['content-type']).toBe('text/plain');
    });

    it('should preserve existing headers when adding new ones', () => {
      response.addHeaders({ 'content-type': 'application/json' });
      response.addHeaders({ 'cache-control': 'no-cache' });

      expect(response._headers['content-type']).toBe('application/json');
      expect(response._headers['cache-control']).toBe('no-cache');
    });
  });

  describe('removeHeaders', () => {
    beforeEach(() => {
      response.addHeaders({
        'content-type': 'application/json',
        'cache-control': 'no-cache',
        authorization: 'Bearer token',
        'user-agent': 'TestAgent/1.0',
      });
    });

    it('should remove single header', () => {
      response.removeHeaders(['content-type']);

      expect(response._headers['content-type']).toBeUndefined();
      expect(response._headers['cache-control']).toBe('no-cache');
    });

    it('should remove multiple headers', () => {
      response.removeHeaders(['content-type', 'authorization']);

      expect(response._headers['content-type']).toBeUndefined();
      expect(response._headers.authorization).toBeUndefined();
      expect(response._headers['cache-control']).toBe('no-cache');
      expect(response._headers['user-agent']).toBe('TestAgent/1.0');
    });

    it('should handle removal of non-existent headers gracefully', () => {
      response.removeHeaders(['non-existent-header' as THttpHeaders]);

      // Should not throw and existing headers should remain
      expect(response._headers['content-type']).toBe('application/json');
    });

    it('should handle empty array', () => {
      response.removeHeaders([]);

      // All headers should remain
      expect(response._headers['content-type']).toBe('application/json');
      expect(response._headers['cache-control']).toBe('no-cache');
    });
  });

  describe('_setBody', () => {
    describe('with automatic content-type detection', () => {
      const bodyTestCases = [
        {
          name: 'JSON object',
          body: { message: 'Hello', status: 'success' },
          expectedContentType: 'application/json',
        },
        {
          name: 'string content',
          body: 'Plain text response',
          expectedContentType: 'text/plain',
        },
        {
          name: 'number',
          body: 42,
          expectedContentType: 'text/plain',
        },
        {
          name: 'boolean',
          body: true,
          expectedContentType: 'text/plain',
        },
      ];

      bodyTestCases.forEach(({ name, body, expectedContentType }) => {
        it(`should auto-detect content-type for ${name}`, () => {
          response._setBody(body);

          expect(response._body).toBe(body);
          expect(response._headers['content-type']).toBe(expectedContentType);
        });
      });
    });

    it('should not override existing content-type header', () => {
      response.addHeaders({ 'content-type': 'application/xml' });
      response._setBody({ data: 'test' });

      expect(response._headers['content-type']).toBe('application/xml');
      expect(response._body).toEqual({ data: 'test' });
    });

    it('should handle null and undefined body', () => {
      response._setBody(null);
      expect(response._body).toBeNull();

      response._setBody(undefined);
      expect(response._body).toBeUndefined();
    });

    it('should update body when called multiple times', () => {
      response._setBody('first body');
      expect(response._body).toBe('first body');

      response._setBody({ second: 'body' });
      expect(response._body).toEqual({ second: 'body' });
    });
  });

  describe('_parseResponseIntoString', () => {
    it('should format basic response correctly', () => {
      response.setStatusCode(httpStatusCode.ok);
      response.addHeaders({ 'content-type': 'application/json' });
      response._setBody({ message: 'success' });

      const responseString = response._parseResponseIntoString();

      expect(responseString).toContain('HTTP/1.1 200 OK');
      expect(responseString).toContain('content-type: application/json');
      expect(responseString).toContain('{"message":"success"}');
    });

    it('should handle responses with multiple headers', () => {
      response.setStatusCode(httpStatusCode.created);
      response.addHeaders({
        'content-type': 'application/json',
        'cache-control': 'no-cache',
        location: '/api/resource/123',
      });
      response._setBody({ id: 123, created: true });

      const responseString = response._parseResponseIntoString();

      expect(responseString).toContain('HTTP/1.1 201 Created');
      expect(responseString).toContain('content-type: application/json');
      expect(responseString).toContain('cache-control: no-cache');
      expect(responseString).toContain('location: /api/resource/123');
      expect(responseString).toContain('{"id":123,"created":true}');
    });

    it('should handle response with no headers', () => {
      response.setStatusCode(httpStatusCode.noContent);
      response._setBody('');

      const responseString = response._parseResponseIntoString();

      expect(responseString).toContain('HTTP/1.1 204 No Content');
      expect(responseString).toContain('\n\n'); // Empty headers section
    });

    it('should handle different protocols', () => {
      const httpRequest = createTestRequest('GET / HTTP/2\r\nHost: localhost\r\n\r\n');
      const httpResponse = new ResponseImpl(httpRequest);

      httpResponse.setStatusCode(httpStatusCode.ok);
      httpResponse._setBody('test');

      const responseString = httpResponse._parseResponseIntoString();
      expect(responseString).toContain('HTTP/2 200 OK');
    });

    it('should format error responses correctly', () => {
      response.setStatusCode(httpStatusCode.internalServerError);
      response.addHeaders({ 'content-type': 'application/json' });
      response._setBody({ success: false, error: 'Something went wrong' });

      const responseString = response._parseResponseIntoString();

      expect(responseString).toContain('HTTP/1.1 500 Internal Server Error');
      expect(responseString).toContain('content-type: application/json');
      expect(responseString).toContain('"success":false');
      expect(responseString).toContain('"error":"Something went wrong"');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete response building workflow', () => {
      // Simulate building a complete API response
      response.setStatusCode(httpStatusCode.created);
      response.addHeaders({
        'content-type': 'application/json',
        location: '/api/users/123',
        'cache-control': 'no-cache',
      });
      response._setBody({
        id: 123,
        name: 'John Doe',
        email: 'john@example.com',
        created: true,
      });

      // Verify all components are correctly set
      expect(response._statusCode).toBe(201);
      expect(response._status).toBe('Created');
      expect(response._headers['content-type']).toBe('application/json');
      expect(response._headers.location).toBe('/api/users/123');
      expect(response._body).toEqual({
        id: 123,
        name: 'John Doe',
        email: 'john@example.com',
        created: true,
      });

      // Verify final string output
      const responseString = response._parseResponseIntoString();
      expect(responseString).toContain('201 Created');
      expect(responseString).toContain('"id":123');
      expect(responseString).toContain('"name":"John Doe"');
    });

    it('should handle modification after initial setup', () => {
      // Initial setup
      response.setStatusCode(httpStatusCode.ok);
      response.addHeaders({ 'content-type': 'text/plain' });
      response._setBody('Initial content');

      // Modifications
      response.setStatusCode(httpStatusCode.accepted);
      response.addHeaders({ 'cache-control': 'max-age=3600' });
      response.removeHeaders(['content-type']);
      response._setBody({ modified: true, timestamp: Date.now() });

      // Verify final state
      expect(response._statusCode).toBe(202);
      expect(response._status).toBe('Accepted');
      expect(response._headers['content-type']).toBe('application/json'); // Auto-detected from new body
      expect(response._headers['cache-control']).toBe('max-age=3600');
      expect(response._body).toEqual({ modified: true, timestamp: expect.any(Number) });
    });
  });
});
