import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { YinzerFlow } from '@core/YinzerFlow.ts';
import type { HandlerCallback } from '@typedefs/public/Context.js';
import { httpStatusCode } from '@constants/http.ts';

describe('YinzerFlow', () => {
  let app: YinzerFlow;
  let testPort: number;

  beforeEach(() => {
    // Use random ports to avoid conflicts
    testPort = 5000 + Math.floor(Math.random() * 1000);
    app = new YinzerFlow({ port: testPort, host: '127.0.0.1' });
  });

  afterEach(async () => {
    // Force close the server even if the test failed
    try {
      if (app.status().isListening) {
        await app.close();
      }
    } catch (error) {
      // Ignore errors during cleanup
    }
  });

  describe('server lifecycle', () => {
    it('should start server and update listening status', async () => {
      expect(app.status().isListening).toBe(false);

      await app.listen();

      expect(app.status().isListening).toBe(true);
      expect(app.status().port).toBe(testPort);
      expect(app.status().host).toBe('127.0.0.1');
    });

    it('should stop server and update listening status', async () => {
      await app.listen();
      expect(app.status().isListening).toBe(true);

      await app.close();

      expect(app.status().isListening).toBe(false);
    });

    it('should handle multiple close calls gracefully', async () => {
      await app.listen();
      await app.close();

      // Second close should not throw
      await app.close();

      expect(app.status().isListening).toBe(false);
    });

    it('should handle close without listen gracefully', async () => {
      // Should not throw when closing a server that was never started
      await app.close();

      expect(app.status().isListening).toBe(false);
    });

    it('should handle multiple listen calls by rejecting', async () => {
      // First listen should succeed
      await app.listen();
      expect(app.status().isListening).toBe(true);

      // Second listen should fail since server is already listening
      await expect(app.listen()).rejects.toThrow();
      expect(app.status().isListening).toBe(true); // Still listening from first call
    });
  });

  describe('configuration handling', () => {
    it('should use default configuration when none provided', () => {
      const defaultApp = new YinzerFlow({});
      const status = defaultApp.status();

      expect(status.port).toBe(5000); // Default port
      expect(status.host).toBe('0.0.0.0'); // Default host
    });

    it('should use custom port and host configuration', () => {
      const customApp = new YinzerFlow({ port: 8080, host: 'localhost' });
      const status = customApp.status();

      expect(status.port).toBe(8080);
      expect(status.host).toBe('localhost');
    });

    it('should handle custom configuration with additional options', () => {
      const customApp = new YinzerFlow({
        port: 9000,
        host: '192.168.1.1',
        logLevel: 'network',
        proxyHops: 2,
      });
      const status = customApp.status();

      expect(status.port).toBe(9000);
      expect(status.host).toBe('192.168.1.1');
    });
  });

  describe('route registration and handling', () => {
    it('should register and handle GET routes', async () => {
      const testResponse = { message: 'GET success' };
      app.get('/test', () => testResponse);

      await app.listen();

      // Simulate HTTP request
      const response = await sendHttpRequest(testPort, 'GET /test HTTP/1.1\r\nHost: localhost\r\n\r\n');

      expect(response).toContain('200 OK');
      expect(response).toContain(JSON.stringify(testResponse));
    });

    it('should register and handle POST routes with body', async () => {
      const handler: HandlerCallback = (ctx) => {
        return { received: ctx.request.body };
      };

      app.post('/api/data', handler);
      await app.listen();

      const requestBody = JSON.stringify({ test: 'data' });
      const request = `POST /api/data HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: ${requestBody.length}\r\n\r\n${requestBody}`;

      const response = await sendHttpRequest(testPort, request);

      expect(response).toContain('200 OK');
      expect(response).toContain('"received":{"test":"data"}');
    });

    it('should handle route parameters', async () => {
      app.get('/users/:id/posts/:postId', (ctx) => {
        return {
          userId: ctx.request.params.id,
          postId: ctx.request.params.postId,
        };
      });

      await app.listen();

      const response = await sendHttpRequest(testPort, 'GET /users/123/posts/456 HTTP/1.1\r\nHost: localhost\r\n\r\n');

      expect(response).toContain('200 OK');
      expect(response).toContain('"userId":"123"');
      expect(response).toContain('"postId":"456"');
    });

    it('should handle query parameters', async () => {
      app.get('/search', (ctx) => {
        return { query: ctx.request.query };
      });

      await app.listen();

      const response = await sendHttpRequest(testPort, 'GET /search?q=test&limit=10 HTTP/1.1\r\nHost: localhost\r\n\r\n');

      expect(response).toContain('200 OK');
      expect(response).toContain('"q":"test"');
      expect(response).toContain('"limit":"10"');
    });
  });

  describe('hook system integration', () => {
    it('should execute beforeAll hooks', async () => {
      const executionOrder: Array<string> = [];

      app.beforeAll([() => executionOrder.push('beforeAll')]);
      app.get('/hook-test', () => {
        executionOrder.push('route');
        return { order: executionOrder };
      });

      await app.listen();

      const response = await sendHttpRequest(testPort, 'GET /hook-test HTTP/1.1\r\nHost: localhost\r\n\r\n');

      expect(response).toContain('"order":["beforeAll","route"]');
    });

    it('should execute afterAll hooks', async () => {
      let afterAllExecuted = false;

      app.afterAll([
        () => {
          afterAllExecuted = true;
        },
      ]);
      app.get('/after-test', () => ({ success: true }));

      await app.listen();

      await sendHttpRequest(testPort, 'GET /after-test HTTP/1.1\r\nHost: localhost\r\n\r\n');

      // Give a moment for afterAll to execute
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(afterAllExecuted).toBe(true);
    });

    it('should execute route-specific hooks', async () => {
      const executionOrder: Array<string> = [];

      app.get(
        '/route-hooks',
        () => {
          executionOrder.push('route');
          return { order: executionOrder };
        },
        {
          beforeHooks: [() => executionOrder.push('beforeRoute')],
          afterHooks: [() => executionOrder.push('afterRoute')],
        },
      );

      await app.listen();

      const response = await sendHttpRequest(testPort, 'GET /route-hooks HTTP/1.1\r\nHost: localhost\r\n\r\n');

      expect(response).toContain('"order":["beforeRoute","route","afterRoute"]');
    });
  });

  describe('error handling', () => {
    it('should handle route handler errors with default error handler', async () => {
      app.get('/error', () => {
        throw new Error('Route error');
      });

      await app.listen();

      const response = await sendHttpRequest(testPort, 'GET /error HTTP/1.1\r\nHost: localhost\r\n\r\n');

      expect(response).toContain('500 Internal Server Error');
      expect(response).toContain('"success":false');
      expect(response).toContain('"message":"Internal Server Error"');
    });

    it('should handle route handler errors with custom error handler', async () => {
      const customErrorResponse = { error: 'Custom error response', code: 'E001' };

      app.onError((ctx) => {
        ctx.response.setStatusCode(httpStatusCode.internalServerError);
        return customErrorResponse;
      });
      app.get('/custom-error', () => {
        throw new Error('Custom route error');
      });

      await app.listen();

      const response = await sendHttpRequest(testPort, 'GET /custom-error HTTP/1.1\r\nHost: localhost\r\n\r\n');

      expect(response).toContain('500 Internal Server Error');
      expect(response).toContain(JSON.stringify(customErrorResponse));
    });

    it('should handle not found routes with default handler', async () => {
      await app.listen();

      const response = await sendHttpRequest(testPort, 'GET /nonexistent HTTP/1.1\r\nHost: localhost\r\n\r\n');

      expect(response).toContain('404 Not Found');
      expect(response).toContain('"success":false');
      expect(response).toContain('"message":"404 Not Found"');
    });

    it('should handle not found routes with custom handler', async () => {
      const customNotFoundResponse = { error: 'Page not found', suggestion: 'Try /api/help' };

      app.onNotFound((ctx) => {
        ctx.response.setStatusCode(httpStatusCode.notFound);
        return customNotFoundResponse;
      });

      await app.listen();

      const response = await sendHttpRequest(testPort, 'GET /missing HTTP/1.1\r\nHost: localhost\r\n\r\n');

      expect(response).toContain('404 Not Found');
      expect(response).toContain(JSON.stringify(customNotFoundResponse));
    });

    it('should handle malformed HTTP requests gracefully', async () => {
      await app.listen();

      // Send malformed request
      const response = await sendHttpRequest(testPort, 'INVALID REQUEST DATA');

      // Should get some response (likely error or default handling)
      expect(response).toBeTruthy();
    });
  });

  describe('group routing', () => {
    it('should handle grouped routes with prefix', async () => {
      app.group('/api', (group) => {
        group.get('/users', () => ({ users: [] }));
        group.post('/users', () => ({ created: true }));
      });

      await app.listen();

      const getResponse = await sendHttpRequest(testPort, 'GET /api/users HTTP/1.1\r\nHost: localhost\r\n\r\n');
      expect(getResponse).toContain('200 OK');
      expect(getResponse).toContain('"users":[]');

      const postResponse = await sendHttpRequest(testPort, 'POST /api/users HTTP/1.1\r\nHost: localhost\r\n\r\n');
      expect(postResponse).toContain('200 OK');
      expect(postResponse).toContain('"created":true');
    });

    it('should handle nested groups with hooks', async () => {
      const executionOrder: Array<string> = [];

      app.group(
        '/api',
        (group) => {
          group.get('/test', () => {
            executionOrder.push('route');
            return { order: executionOrder };
          });
        },
        {
          beforeHooks: [() => executionOrder.push('groupBefore')],
          afterHooks: [() => executionOrder.push('groupAfter')],
        },
      );

      await app.listen();

      const response = await sendHttpRequest(testPort, 'GET /api/test HTTP/1.1\r\nHost: localhost\r\n\r\n');

      expect(response).toContain('"order":["groupBefore","route","groupAfter"]');
    });
  });

  describe('HTTP methods support', () => {
    const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'] as const;

    httpMethods.forEach((method) => {
      it(`should handle ${method} requests`, async () => {
        const methodLower = method.toLowerCase() as 'delete' | 'get' | 'options' | 'patch' | 'post' | 'put';

        app[methodLower]('/method-test', () => ({ method }));

        await app.listen();

        const request = `${method} /method-test HTTP/1.1\r\nHost: localhost\r\n\r\n`;
        const response = await sendHttpRequest(testPort, request);

        expect(response).toContain('200 OK');
        expect(response).toContain(`"method":"${method}"`);
      });
    });
  });

  describe('response handling', () => {
    it('should handle custom status codes', async () => {
      app.get('/custom-status', (ctx) => {
        ctx.response.setStatusCode(httpStatusCode.created);
        return { created: true };
      });

      await app.listen();

      const response = await sendHttpRequest(testPort, 'GET /custom-status HTTP/1.1\r\nHost: localhost\r\n\r\n');

      expect(response).toContain('201 Created');
      expect(response).toContain('"created":true');
    });

    it('should handle custom headers', async () => {
      app.get('/custom-headers', (ctx) => {
        ctx.response.addHeaders({
          'x-custom-header': 'test-value',
          'cache-control': 'no-cache',
        });
        return { success: true };
      });

      await app.listen();

      const response = await sendHttpRequest(testPort, 'GET /custom-headers HTTP/1.1\r\nHost: localhost\r\n\r\n');

      expect(response).toContain('x-custom-header: test-value');
      expect(response).toContain('cache-control: no-cache');
    });

    it('should handle different response content types', async () => {
      app.get('/json', () => ({ type: 'json' }));
      app.get('/text', () => 'Plain text response');
      app.get('/number', () => 42);
      app.get('/boolean', () => true);

      await app.listen();

      const jsonResponse = await sendHttpRequest(testPort, 'GET /json HTTP/1.1\r\nHost: localhost\r\n\r\n');
      expect(jsonResponse).toContain('content-type: application/json');

      const textResponse = await sendHttpRequest(testPort, 'GET /text HTTP/1.1\r\nHost: localhost\r\n\r\n');
      expect(textResponse).toContain('content-type: text/plain');
    });
  });

  describe('server error scenarios', () => {
    it('should handle invalid port configuration', () => {
      // Invalid port should throw during construction
      expect(() => new YinzerFlow({ port: -1, host: '127.0.0.1' })).toThrow('Invalid port number');
      expect(() => new YinzerFlow({ port: 70000, host: '127.0.0.1' })).toThrow('Invalid port number');
      expect(() => new YinzerFlow({ port: 0, host: '127.0.0.1' })).toThrow('Invalid port number');
    });

    it('should handle port already in use error', async () => {
      // Start first server
      await app.listen();

      // Try to start second server on same port
      const conflictApp = new YinzerFlow({ port: testPort, host: '127.0.0.1' });

      await expect(conflictApp.listen()).rejects.toThrow();
      expect(conflictApp.status().isListening).toBe(false);
    });

    it('should handle request processing errors by destroying socket', async () => {
      await app.listen();

      // Send malformed data that should cause request processing to fail
      // This tests the try/catch block in the socket data handler
      const net = await import('net');

      const errorPromise = new Promise<boolean>((resolve) => {
        const client = net.createConnection({ port: testPort, host: '127.0.0.1' }, () => {
          // Send data that will cause parsing/processing errors
          client.write(Buffer.from([0xff, 0xfe, 0xfd])); // Invalid binary data
        });

        client.on('error', () => {
          // Socket was destroyed due to processing error
          resolve(true);
        });

        client.on('close', () => {
          // Socket was closed/destroyed
          resolve(true);
        });

        // Timeout if no error occurs
        setTimeout(() => resolve(false), 1000);
      });

      const errorOccurred = await errorPromise;
      expect(errorOccurred).toBe(true);
    });

    it('should handle promise rejection in request handler', async () => {
      await app.listen();

      // Test the outer .catch() block by sending data that causes async processing to fail
      const net = await import('net');

      const promiseRejectionHandled = new Promise<boolean>((resolve) => {
        const client = net.createConnection({ port: testPort, host: '127.0.0.1' }, () => {
          // Send data that will trigger the promise catch block
          client.write('MALFORMED REQUEST WITHOUT PROPER HTTP FORMAT');
        });

        client.on('close', () => {
          // Connection was closed, indicating error handling occurred
          resolve(true);
        });

        client.on('error', () => {
          // Socket error also indicates error handling
          resolve(true);
        });

        // Timeout if no error handling occurs
        setTimeout(() => resolve(false), 2000);
      });

      const handled = await promiseRejectionHandled;
      expect(handled).toBe(true);
    });
  });

  describe('inherited SetupImpl method coverage', () => {
    it('should handle hook registration with options', async () => {
      const executionOrder: Array<string> = [];

      // Test beforeAll with options
      app.beforeAll([() => executionOrder.push('beforeAll1')], {
        routesToInclude: ['/test'],
        routesToExclude: [],
      });

      // Test afterAll with options
      app.afterAll([() => executionOrder.push('afterAll1')], {
        routesToInclude: [],
        routesToExclude: ['/exclude'],
      });

      app.get('/test', () => {
        executionOrder.push('route');
        return { order: executionOrder };
      });

      await app.listen();

      const response = await sendHttpRequest(testPort, 'GET /test HTTP/1.1\r\nHost: localhost\r\n\r\n');

      expect(response).toContain('200 OK');
      expect(response).toContain('"order":["beforeAll1","route","afterAll1"]');
    });

    it('should handle route registration with undefined options', async () => {
      // Test that undefined options get default values
      app.get('/undefined-options', () => ({ success: true }), undefined);
      app.post('/undefined-options', () => ({ success: true }), undefined);

      await app.listen();

      const getResponse = await sendHttpRequest(testPort, 'GET /undefined-options HTTP/1.1\r\nHost: localhost\r\n\r\n');
      expect(getResponse).toContain('200 OK');

      const postResponse = await sendHttpRequest(testPort, 'POST /undefined-options HTTP/1.1\r\nHost: localhost\r\n\r\n');
      expect(postResponse).toContain('200 OK');
    });

    it('should handle complex group nesting with multiple hook layers', async () => {
      const executionOrder: Array<string> = [];

      app.group(
        '/api/v1',
        (group) => {
          group.get(
            '/users/:id',
            () => {
              executionOrder.push('route');
              return { order: executionOrder };
            },
            {
              beforeHooks: [() => executionOrder.push('routeBefore')],
              afterHooks: [() => executionOrder.push('routeAfter')],
            },
          );
        },
        {
          beforeHooks: [() => executionOrder.push('groupBefore')],
          afterHooks: [() => executionOrder.push('groupAfter')],
        },
      );

      await app.listen();

      const response = await sendHttpRequest(testPort, 'GET /api/v1/users/123 HTTP/1.1\r\nHost: localhost\r\n\r\n');

      expect(response).toContain('200 OK');
      expect(response).toContain('"order":["groupBefore","routeBefore","route","routeAfter","groupAfter"]');
    });
  });

  describe('edge cases and integration', () => {
    it('should handle empty request body', async () => {
      app.post('/empty-body', (ctx) => {
        return { receivedBody: ctx.request.body };
      });

      await app.listen();

      const response = await sendHttpRequest(testPort, 'POST /empty-body HTTP/1.1\r\nHost: localhost\r\n\r\n');

      expect(response).toContain('200 OK');
    });

    it('should handle concurrent requests', async () => {
      app.get('/concurrent/:id', (ctx) => {
        return { id: ctx.request.params.id, timestamp: Date.now() };
      });

      await app.listen();

      // Send multiple concurrent requests
      const requests = Array.from({ length: 3 }, async (_, i) => sendHttpRequest(testPort, `GET /concurrent/${i} HTTP/1.1\r\nHost: localhost\r\n\r\n`));

      const responses = await Promise.all(requests);

      responses.forEach((response, index) => {
        expect(response).toContain('200 OK');
        expect(response).toContain(`"id":"${index}"`);
      });
    });

    it('should handle large request bodies', async () => {
      app.post('/large-body', (ctx) => {
        return {
          bodyLength: JSON.stringify(ctx.request.body).length,
          received: true,
        };
      });

      await app.listen();

      const largeData = { data: 'x'.repeat(1000) };
      const requestBody = JSON.stringify(largeData);
      const request = `POST /large-body HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: ${requestBody.length}\r\n\r\n${requestBody}`;

      const response = await sendHttpRequest(testPort, request);

      expect(response).toContain('200 OK');
      expect(response).toContain('"received":true');
    });

    it('should handle async route handlers', async () => {
      app.get('/async', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { async: true, delayed: true };
      });

      await app.listen();

      const response = await sendHttpRequest(testPort, 'GET /async HTTP/1.1\r\nHost: localhost\r\n\r\n');

      expect(response).toContain('200 OK');
      expect(response).toContain('"async":true');
      expect(response).toContain('"delayed":true');
    });
  });
});

// Helper function to send HTTP requests to the test server
const sendHttpRequest = async (port: number, request: string): Promise<string> => {
  const net = await import('net');

  return new Promise((resolve, reject) => {
    const client = net.createConnection({ port, host: '127.0.0.1' }, () => {
      client.write(request);
    });

    let response = '';
    client.on('data', (data) => {
      response += data.toString();
    });

    client.on('end', () => {
      resolve(response);
    });

    client.on('error', (error) => {
      reject(error);
    });

    // Set timeout to prevent hanging tests
    setTimeout(() => {
      client.destroy();
      if (response) {
        resolve(response);
      } else {
        reject(new Error('Request timeout'));
      }
    }, 5000);
  });
};
