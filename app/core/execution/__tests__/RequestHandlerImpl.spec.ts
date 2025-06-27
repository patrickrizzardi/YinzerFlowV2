import { beforeEach, describe, expect, it } from 'bun:test';
import { RequestHandlerImpl } from '../RequestHandlerImpl.ts';
import { ContextImpl } from '../ContextImpl.ts';
import { SetupImpl } from '@core/setup/SetupImpl.ts';
import { httpStatusCode } from '@constants/http.ts';
import type { HandlerCallback } from '@typedefs/public/Context.js';
import type { InternalContextImpl } from '@typedefs/internal/InternalContextImpl.ts';

const createPostRequest = (path = '/api/test', body = ''): string => {
  return `POST ${path} HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: ${body.length}\r\n\r\n${body}`;
};

describe('RequestHandler', () => {
  let setup: SetupImpl;
  let requestHandler: RequestHandlerImpl;

  beforeEach(() => {
    setup = new SetupImpl();
    requestHandler = new RequestHandlerImpl(setup);
  });

  describe('constructor', () => {
    it('should initialize with setup instance', () => {
      expect(requestHandler).toBeInstanceOf(RequestHandlerImpl);
    });
  });

  describe('handle - route matching', () => {
    it('should call not found handler when no route matches', async () => {
      const context = new ContextImpl('GET /nonexistent HTTP/1.1\r\n\r\n', setup) as InternalContextImpl;

      await requestHandler.handle(context);

      expect(context._response._body).toEqual({
        success: false,
        message: '404 Not Found',
      });
    });

    it('should execute matched route handler', async () => {
      const testResponse = { message: 'Route executed' };
      const routeHandler: HandlerCallback = () => testResponse;

      setup.get('/test', routeHandler);
      const context = new ContextImpl('GET /test HTTP/1.1\r\n\r\n', setup) as InternalContextImpl;

      await requestHandler.handle(context);

      expect(context._response._body).toEqual(testResponse);
    });

    it('should handle async route handlers', async () => {
      const asyncResponse = { async: true, data: 'test' };
      const asyncHandler: HandlerCallback = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return asyncResponse;
      };

      setup.post('/async', asyncHandler);
      const context = new ContextImpl(createPostRequest('/async'), setup) as InternalContextImpl;

      await requestHandler.handle(context);

      expect(context._response._body).toEqual(asyncResponse);
    });
  });

  describe('handle - hook execution order', () => {
    it('should execute hooks in correct order: beforeAll -> beforeRoute -> handler -> afterRoute -> afterAll', async () => {
      const executionOrder: Array<string> = [];

      const beforeAllHandler: HandlerCallback = () => {
        executionOrder.push('beforeAll');
      };

      const beforeRouteHandler: HandlerCallback = () => {
        executionOrder.push('beforeRoute');
      };

      const routeHandler: HandlerCallback = () => {
        executionOrder.push('route');
        return { success: true };
      };

      const afterRouteHandler: HandlerCallback = () => {
        executionOrder.push('afterRoute');
      };

      const afterAllHandler: HandlerCallback = () => {
        executionOrder.push('afterAll');
      };

      setup.beforeAll([beforeAllHandler]);
      setup.afterAll([afterAllHandler]);
      setup.get('/order-test', routeHandler, {
        beforeHooks: [beforeRouteHandler],
        afterHooks: [afterRouteHandler],
      });

      const context = new ContextImpl('GET /order-test HTTP/1.1\r\n\r\n', setup) as InternalContextImpl;

      await requestHandler.handle(context);

      expect(executionOrder).toEqual(['beforeAll', 'beforeRoute', 'route', 'afterRoute', 'afterAll']);
      expect(context._response._body).toEqual({ success: true });
    });

    it('should execute multiple beforeAll hooks in order', async () => {
      const executionOrder: Array<string> = [];

      const beforeHook1: HandlerCallback = () => executionOrder.push('before1');
      const beforeHook2: HandlerCallback = () => executionOrder.push('before2');
      const routeHandler: HandlerCallback = () => {
        executionOrder.push('route');
        return { executed: true };
      };

      setup.beforeAll([beforeHook1, beforeHook2]);
      setup.get('/multi-before', routeHandler);

      const context = new ContextImpl('GET /multi-before HTTP/1.1\r\n\r\n', setup) as InternalContextImpl;

      await requestHandler.handle(context);

      expect(executionOrder).toEqual(['before1', 'before2', 'route']);
    });

    it('should execute multiple afterAll hooks in order', async () => {
      const executionOrder: Array<string> = [];

      const routeHandler: HandlerCallback = () => {
        executionOrder.push('route');
        return { executed: true };
      };
      const afterHook1: HandlerCallback = () => executionOrder.push('after1');
      const afterHook2: HandlerCallback = () => executionOrder.push('after2');

      setup.afterAll([afterHook1, afterHook2]);
      setup.get('/multi-after', routeHandler);

      const context = new ContextImpl('GET /multi-after HTTP/1.1\r\n\r\n', setup) as InternalContextImpl;

      await requestHandler.handle(context);

      expect(executionOrder).toEqual(['route', 'after1', 'after2']);
    });
  });

  describe('handle - response building', () => {
    it('should set response body from route handler return value', async () => {
      const responseData = {
        id: 123,
        name: 'Test User',
        active: true,
      };

      const handler: HandlerCallback = () => responseData;

      setup.post('/user', handler);
      const context = new ContextImpl(createPostRequest('/user', '{"test": true}'), setup) as InternalContextImpl;

      await requestHandler.handle(context);

      expect(context._response._body).toEqual(responseData);
    });

    it('should handle void return from route handler', async () => {
      const handler: HandlerCallback = () => {
        // No return value
      };

      setup.get('/void', handler);
      const context = new ContextImpl('GET /void HTTP/1.1\r\n\r\n', setup) as InternalContextImpl;

      await requestHandler.handle(context);

      expect(context._response._body).toBeUndefined();
    });

    it('should allow hooks to modify response', async () => {
      const handler: HandlerCallback = () => ({ original: true });

      const afterHook: HandlerCallback = (ctx) => {
        ctx.response.setStatusCode(httpStatusCode.created);
        ctx.response.addHeaders({ 'x-custom': 'modified' });
      };

      setup.get('/modify', handler, {
        beforeHooks: [],
        afterHooks: [afterHook],
      });

      const context = new ContextImpl('GET /modify HTTP/1.1\r\n\r\n', setup) as InternalContextImpl;

      await requestHandler.handle(context);

      expect(context._response._body).toEqual({ original: true });
      expect(context._response._statusCode).toBe(httpStatusCode.created);
      expect(context._response._headers['x-custom']).toBe('modified');
    });
  });

  describe('handle - error handling', () => {
    it('should use default error handler when route throws', async () => {
      const errorHandler: HandlerCallback = () => {
        throw new Error('Route error');
      };

      setup.get('/error', errorHandler);
      const context = new ContextImpl('GET /error HTTP/1.1\r\n\r\n', setup) as InternalContextImpl;

      await requestHandler.handle(context);

      expect(context._response._body).toEqual({
        success: false,
        message: 'Internal Server Error',
      });
    });

    it('should use custom error handler when provided', async () => {
      const customErrorResponse = { error: 'Custom error', code: 'E001' };

      setup.onError(() => customErrorResponse);

      const errorHandler: HandlerCallback = () => {
        throw new Error('Test error');
      };

      setup.get('/custom-error', errorHandler);
      const context = new ContextImpl('GET /custom-error HTTP/1.1\r\n\r\n', setup) as InternalContextImpl;

      await requestHandler.handle(context);

      expect(context._response._body).toEqual(customErrorResponse);
    });

    it('should handle errors in beforeAll hooks', async () => {
      const errorBeforeHook: HandlerCallback = () => {
        throw new Error('Before hook error');
      };

      const routeHandler: HandlerCallback = () => ({ should: 'not execute' });

      setup.beforeAll([errorBeforeHook]);
      setup.get('/before-error', routeHandler);

      const context = new ContextImpl('GET /before-error HTTP/1.1\r\n\r\n', setup) as InternalContextImpl;

      await requestHandler.handle(context);

      expect(context._response._body).toEqual({
        success: false,
        message: 'Internal Server Error',
      });
    });

    it('should handle errors in afterAll hooks', async () => {
      const routeHandler: HandlerCallback = () => ({ success: true });

      const errorAfterHook: HandlerCallback = () => {
        throw new Error('After hook error');
      };

      setup.afterAll([errorAfterHook]);
      setup.get('/after-error', routeHandler);

      const context = new ContextImpl('GET /after-error HTTP/1.1\r\n\r\n', setup) as InternalContextImpl;

      await requestHandler.handle(context);

      expect(context._response._body).toEqual({
        success: false,
        message: 'Internal Server Error',
      });
    });

    it('should handle error handler failure with fallback', async () => {
      const brokenErrorHandler: HandlerCallback = () => {
        throw new Error('Error handler is broken');
      };

      setup.onError(brokenErrorHandler);

      const errorRoute: HandlerCallback = () => {
        throw new Error('Original error');
      };

      setup.get('/double-error', errorRoute);
      const context = new ContextImpl('GET /double-error HTTP/1.1\r\n\r\n', setup) as InternalContextImpl;

      await requestHandler.handle(context);

      expect(context._response._body).toEqual({
        success: false,
        message: 'Internal Server Error',
      });
      expect(context._response._statusCode).toBe(httpStatusCode.internalServerError);
    });
  });

  describe('handle - different HTTP methods', () => {
    const httpMethods = [
      { method: 'GET', setupMethod: 'get', request: 'GET /test HTTP/1.1\r\n\r\n' },
      { method: 'POST', setupMethod: 'post', request: createPostRequest('/test', '{"data": true}') },
      { method: 'PUT', setupMethod: 'put', request: 'PUT /test HTTP/1.1\r\n\r\n' },
      { method: 'DELETE', setupMethod: 'delete', request: 'DELETE /test HTTP/1.1\r\n\r\n' },
      { method: 'PATCH', setupMethod: 'patch', request: 'PATCH /test HTTP/1.1\r\n\r\n' },
    ];

    httpMethods.forEach(({ method, setupMethod, request }) => {
      it(`should handle ${method} requests`, async () => {
        const responseData = { method, handled: true };
        const handler: HandlerCallback = () => responseData;

        (setup as any)[setupMethod]('/test', handler);
        const context = new ContextImpl(request, setup) as InternalContextImpl;

        await requestHandler.handle(context);

        expect(context._response._body).toEqual(responseData);
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete request lifecycle with all features', async () => {
      const executionLog: Array<string> = [];
      const responseData = {
        message: 'Complete workflow',
        timestamp: expect.any(Number),
      };

      // Setup all types of hooks
      const authHook: HandlerCallback = () => {
        executionLog.push('auth');
      };

      const loggingHook: HandlerCallback = () => {
        executionLog.push('logging');
      };

      const beforeRouteHook: HandlerCallback = (ctx) => {
        executionLog.push('beforeRoute');
        ctx.response.addHeaders({ 'x-before': 'true' });
      };

      const routeHandler: HandlerCallback = (ctx) => {
        executionLog.push('route');
        return {
          message: 'Complete workflow',
          timestamp: Date.now(),
        };
      };

      const afterRouteHook: HandlerCallback = (ctx) => {
        executionLog.push('afterRoute');
        ctx.response.addHeaders({ 'x-after': 'true' });
      };

      const cleanupHook: HandlerCallback = () => {
        executionLog.push('cleanup');
      };

      setup.beforeAll([authHook, loggingHook]);
      setup.afterAll([cleanupHook]);
      setup.post('/complete', routeHandler, {
        beforeHooks: [beforeRouteHook],
        afterHooks: [afterRouteHook],
      });

      const context = new ContextImpl(createPostRequest('/complete', '{"test": "data"}'), setup) as InternalContextImpl;

      await requestHandler.handle(context);

      // Verify execution order
      expect(executionLog).toEqual(['auth', 'logging', 'beforeRoute', 'route', 'afterRoute', 'cleanup']);

      // Verify response
      expect(context._response._body).toEqual(responseData);

      // Verify headers from hooks
      expect(context._response._headers['x-before']).toBe('true');
      expect(context._response._headers['x-after']).toBe('true');
    });
  });
});
