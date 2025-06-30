import { beforeEach, describe, expect, it } from 'bun:test';
import { ResponseImpl } from '../ResponseImpl.ts';
import { RequestImpl } from '../RequestImpl.ts';
import { SetupImpl } from '@core/setup/SetupImpl.ts';
import { httpStatus, httpStatusCode } from '@constants/http.ts';
import type { Request } from '@typedefs/public/Request.ts';
import type { InternalHttpHeaders, InternalHttpStatusCode } from '@typedefs/constants/http.js';

// Reusable test data builders
const createTestRequest = (requestString = 'GET / HTTP/1.1\r\nHost: localhost\r\n\r\n'): Request => {
  return new RequestImpl(Buffer.from(requestString), new SetupImpl());
};



const createCompleteResponse = (request: Request, statusCode: InternalHttpStatusCode, headers: Record<string, string>, body: any) => {
  const response = new ResponseImpl(request);
  response.setStatusCode(statusCode);
  response.addHeaders(headers);
  response._setBody(body);
  return response;
};

const createStandardHeaders = () => ({
  'content-type': 'application/json',
  'cache-control': 'no-cache',
  authorization: 'Bearer token',
  'user-agent': 'TestAgent/1.0',
});

describe('ResponseImpl', () => {
  let request: Request;
  let response: ResponseImpl;

  beforeEach(() => {
    request = createTestRequest();
    response = new ResponseImpl(request);
  });

  describe('Initialization', () => {
    describe('Constructor', () => {
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
  });

  describe('Status Code Management', () => {
    const statusCodeTestCases = [
      { code: httpStatusCode.ok, expectedStatus: httpStatus.ok, description: 'OK (200)' },
      { code: httpStatusCode.created, expectedStatus: httpStatus.created, description: 'Created (201)' },
      { code: httpStatusCode.badRequest, expectedStatus: httpStatus.badRequest, description: 'Bad Request (400)' },
      { code: httpStatusCode.notFound, expectedStatus: httpStatus.notFound, description: 'Not Found (404)' },
      { code: httpStatusCode.internalServerError, expectedStatus: httpStatus.internalServerError, description: 'Internal Server Error (500)' },
    ];

    describe('Setting Status Codes', () => {
      it.each(statusCodeTestCases)('should set $description and corresponding status message', ({ code, expectedStatus }) => {
        response.setStatusCode(code);

        expect(response._statusCode).toBe(code);
        expect(response._status).toBe(expectedStatus);
      });

      it('should update status when called multiple times', () => {
        response.setStatusCode(httpStatusCode.created);
        expect(response._statusCode).toBe(httpStatusCode.created);

        response.setStatusCode(httpStatusCode.badRequest);
        expect(response._statusCode).toBe(httpStatusCode.badRequest);
        expect(response._status).toBe(httpStatus.badRequest);
      });
    });
  });

  describe('Header Management', () => {
    describe('Adding Headers', () => {
      const headerTestCases = [
        {
          description: 'single header',
          headers: { 'content-type': 'application/json' },
          expectedResult: { 'content-type': 'application/json' },
        },
        {
          description: 'multiple headers at once',
          headers: {
            'content-type': 'text/html',
            'cache-control': 'no-cache',
            authorization: 'Bearer token123',
          },
          expectedResult: {
            'content-type': 'text/html',
            'cache-control': 'no-cache',
            authorization: 'Bearer token123',
          },
        },
      ];

      it.each(headerTestCases)('should add $description', ({ headers, expectedResult }) => {
        response.addHeaders(headers);

        Object.entries(expectedResult).forEach(([key, value]) => {
          expect(response._headers[key as keyof typeof response._headers]).toBe(value);
        });
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

    describe('Removing Headers', () => {
      beforeEach(() => {
        response.addHeaders(createStandardHeaders());
      });

      const headerRemovalTestCases = [
        {
          description: 'single header',
          headersToRemove: ['content-type'],
          expectedRemoved: ['content-type'],
          expectedRemaining: ['cache-control'],
        },
        {
          description: 'multiple headers',
          headersToRemove: ['content-type', 'authorization'],
          expectedRemoved: ['content-type', 'authorization'],
          expectedRemaining: ['cache-control', 'user-agent'],
        },
      ];

      it.each(headerRemovalTestCases)('should remove $description', ({ headersToRemove, expectedRemoved, expectedRemaining }) => {
        response.removeHeaders(headersToRemove);

        expectedRemoved.forEach((header) => {
          expect(response._headers[header as keyof typeof response._headers]).toBeUndefined();
        });

        expectedRemaining.forEach((header) => {
          expect(response._headers[header as keyof typeof response._headers]).toBeDefined();
        });
      });

      const edgeCaseTests = [
        {
          description: 'non-existent headers gracefully',
          headersToRemove: ['non-existent-header' as InternalHttpHeaders],
          shouldPreserveExisting: true,
        },
        {
          description: 'empty array',
          headersToRemove: [],
          shouldPreserveExisting: true,
        },
      ];

      it.each(edgeCaseTests)('should handle removal of $description', ({ headersToRemove, shouldPreserveExisting }) => {
        response.removeHeaders(headersToRemove);

        if (shouldPreserveExisting) {
          expect(response._headers['content-type']).toBe('application/json');
          expect(response._headers['cache-control']).toBe('no-cache');
        }
      });
    });
  });

  describe('Body Handling', () => {
    describe('Content Type Auto-Detection', () => {
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

      it.each(bodyTestCases)('should auto-detect content-type for $name', ({ body, expectedContentType }) => {
        response._setBody(body);

        expect(response._body).toBe(body);
        expect(response._headers['Content-Type']).toBe(expectedContentType);
      });
    });

    describe('Body Content Management', () => {
      it('should not override existing content-type header', () => {
        response.addHeaders({ 'content-type': 'application/xml' });
        response._setBody({ data: 'test' });

        expect(response._headers['content-type']).toBe('application/xml');
        expect(response._body).toEqual({ data: 'test' });
      });

      const specialValueTests = [
        { value: null, description: 'null' },
        { value: undefined, description: 'undefined' },
      ];

      it.each(specialValueTests)('should handle $description body', ({ value }) => {
        response._setBody(value);
        expect(response._body).toBe(value);
      });

      it('should update body when called multiple times', () => {
        response._setBody('first body');
        expect(response._body).toBe('first body');

        response._setBody({ second: 'body' });
        expect(response._body).toEqual({ second: 'body' });
      });
    });
  });

  describe('Response Formatting', () => {
    describe('HTTP String Generation', () => {
      const formatTestCases = [
        {
          description: 'basic response correctly',
          statusCode: httpStatusCode.ok,
          headers: { 'content-type': 'application/json' },
          body: { message: 'success' },
          expectedContains: ['HTTP/1.1 200 OK', 'content-type: application/json', '{"message":"success"}'],
        },
        {
          description: 'response with multiple headers',
          statusCode: httpStatusCode.created,
          headers: {
            'content-type': 'application/json',
            'cache-control': 'no-cache',
            location: '/api/resource/123',
          },
          body: { id: 123, created: true },
          expectedContains: [
            'HTTP/1.1 201 Created',
            'content-type: application/json',
            'cache-control: no-cache',
            'location: /api/resource/123',
            '{"id":123,"created":true}',
          ],
        },
        {
          description: 'error responses correctly',
          statusCode: httpStatusCode.internalServerError,
          headers: { 'content-type': 'application/json' },
          body: { success: false, error: 'Something went wrong' },
          expectedContains: ['HTTP/1.1 500 Internal Server Error', 'content-type: application/json', '"success":false', '"error":"Something went wrong"'],
        },
      ];

      it.each(formatTestCases)('should format $description', ({ statusCode, headers, body, expectedContains }) => {
        response.setStatusCode(statusCode);
        response.addHeaders(headers);
        response._setBody(body);

        response._parseResponseIntoString();

        expectedContains.forEach((expectedContent) => {
          expect(response._stringBody).toContain(expectedContent);
        });
      });

      it('should handle response with no headers', () => {
        response.setStatusCode(httpStatusCode.noContent);
        response._setBody('');

        response._parseResponseIntoString();

        expect(response._stringBody).toContain('HTTP/1.1 204 No Content');
        expect(response._stringBody).toContain('\n\n'); // Empty headers section
      });

      it('should handle different protocols', () => {
        const httpRequest = createTestRequest('GET / HTTP/2\r\nHost: localhost\r\n\r\n');
        const httpResponse = new ResponseImpl(httpRequest);

        httpResponse.setStatusCode(httpStatusCode.ok);
        httpResponse._setBody('test');

        httpResponse._parseResponseIntoString();
        expect(httpResponse._stringBody).toContain('HTTP/2 200 OK');
      });
    });
  });

  describe('Integration Scenarios', () => {
    describe('Complete Workflow', () => {
      it('should handle complete response building workflow', () => {
        const testData = {
          statusCode: httpStatusCode.created,
          headers: {
            'content-type': 'application/json',
            location: '/api/users/123',
            'cache-control': 'no-cache',
          },
          body: {
            id: 123,
            name: 'John Doe',
            email: 'john@example.com',
            created: true,
          },
        };

        // Build response using builder function
        const completeResponse = createCompleteResponse(request, testData.statusCode, testData.headers, testData.body);

        // Verify all components are correctly set
        expect(completeResponse._statusCode).toBe(201);
        expect(completeResponse._status).toBe('Created');
        expect(completeResponse._headers['content-type']).toBe('application/json');
        expect(completeResponse._headers.location).toBe('/api/users/123');
        expect(completeResponse._body).toEqual(testData.body);

        // Verify final string output
        completeResponse._parseResponseIntoString();
        expect(completeResponse._stringBody).toContain('201 Created');
        expect(completeResponse._stringBody).toContain('"id":123');
        expect(completeResponse._stringBody).toContain('"name":"John Doe"');
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
        expect(response._headers['Content-Type']).toBe('application/json'); // Auto-detected from new body
        expect(response._headers['cache-control']).toBe('max-age=3600');
        expect(response._body).toEqual({ modified: true, timestamp: expect.any(Number) });
      });
    });

    describe('Real-World Scenarios', () => {
      const apiResponseScenarios = [
        {
          scenario: 'successful API creation',
          statusCode: httpStatusCode.created,
          headers: { location: '/api/users/456' },
          body: { id: 456, username: 'newuser', active: true },
          expectedStatusText: '201 Created',
        },
        {
          scenario: 'validation error response',
          statusCode: httpStatusCode.badRequest,
          headers: { 'content-type': 'application/json' },
          body: { error: 'Validation failed', fields: ['email', 'password'] },
          expectedStatusText: '400 Bad Request',
        },
        {
          scenario: 'authentication required response',
          statusCode: httpStatusCode.unauthorized,
          headers: { 'www-authenticate': 'Bearer' },
          body: { error: 'Authentication required' },
          expectedStatusText: '401 Unauthorized',
        },
      ];

      it.each(apiResponseScenarios)('should handle $scenario', ({ statusCode, headers, body, expectedStatusText }) => {
        const apiResponse = createCompleteResponse(request, statusCode, headers, body);
        apiResponse._parseResponseIntoString();

        expect(apiResponse._stringBody).toContain(expectedStatusText);
        expect(apiResponse._body).toEqual(body);
        Object.entries(headers).forEach(([key, value]) => {
          expect(apiResponse._headers[key as keyof typeof apiResponse._headers]).toBe(value);
        });
      });
    });
  });
});
