import { describe, expect, it } from 'bun:test';
import { httpMethod } from '@constants/http.ts';
import { RouteRegistry } from '@core/setup/RouteRegistryImpl.ts';

describe('RouteRegistry', () => {
  describe('Exact Routes (no parameters)', () => {
    it('should register and find exact routes', () => {
      const routeRegistry = new RouteRegistry();
      const handler = () => {};

      routeRegistry.register({ method: httpMethod.get, path: '/', handler });

      const match = routeRegistry.findRoute(httpMethod.get, '/');
      expect(match).toBeDefined();
      expect(match?.route.handler).toBe(handler);
      expect(match?.params).toEqual({});
    });

    it('should throw an error if an exact route already exists', () => {
      const routeRegistry = new RouteRegistry();

      routeRegistry.register({ method: httpMethod.get, path: '/', handler: () => {} });

      expect(() => routeRegistry.register({ method: httpMethod.get, path: '/', handler: () => {} })).toThrow('Route / already exists for method GET');
    });
  });

  describe('Parameterized Routes', () => {
    it('should register and find routes with single parameter', () => {
      const routeRegistry = new RouteRegistry();
      const handler = () => {};

      routeRegistry.register({ method: httpMethod.get, path: '/users/:id', handler });

      const match = routeRegistry.findRoute(httpMethod.get, '/users/123');
      expect(match).toBeDefined();
      expect(match?.route.handler).toBe(handler);
      expect(match?.params).toEqual({ id: '123' });
    });

    it('should extract multiple parameters correctly', () => {
      const routeRegistry = new RouteRegistry();

      routeRegistry.register({
        method: httpMethod.get,
        path: '/users/:userId/posts/:postId',
        handler: () => {},
      });

      const match = routeRegistry.findRoute(httpMethod.get, '/users/123/posts/456');
      expect(match).toBeDefined();
      expect(match?.params).toEqual({ userId: '123', postId: '456' });
    });

    it('should handle complex parameter patterns (non-numeric)', () => {
      const routeRegistry = new RouteRegistry();

      routeRegistry.register({
        method: httpMethod.get,
        path: '/api/v1/users/:id/posts/:postId/comments/:commentId',
        handler: () => {},
      });

      const match = routeRegistry.findRoute(httpMethod.get, '/api/v1/users/user123/posts/post456/comments/comment789');
      expect(match).toBeDefined();
      expect(match?.params).toEqual({
        id: 'user123',
        postId: 'post456',
        commentId: 'comment789',
      });
    });

    it('should not match if path structure is different', () => {
      const routeRegistry = new RouteRegistry();

      routeRegistry.register({
        method: httpMethod.get,
        path: '/users/:id/posts/:postId',
        handler: () => {},
      });

      // Too few segments
      expect(routeRegistry.findRoute(httpMethod.get, '/users/123')).toBeUndefined();

      // Too many segments
      expect(routeRegistry.findRoute(httpMethod.get, '/users/123/posts/456/extra')).toBeUndefined();

      // Different structure
      expect(routeRegistry.findRoute(httpMethod.get, '/posts/123/users/456')).toBeUndefined();
    });

    it('should throw error if parameterized route pattern already exists', () => {
      const routeRegistry = new RouteRegistry();

      routeRegistry.register({ method: httpMethod.get, path: '/users/:id', handler: () => {} });

      expect(() => routeRegistry.register({ method: httpMethod.get, path: '/users/:userId', handler: () => {} })).toThrow(
        'Route /users/:userId already exists for method GET',
      );
    });

    it('should prevent conflicting parameterized route structures', () => {
      const routeRegistry = new RouteRegistry();

      routeRegistry.register({ method: httpMethod.get, path: '/api/:version/users', handler: () => 'first' });

      // Should throw error when trying to register a route with same structure but different param name
      expect(() => routeRegistry.register({ method: httpMethod.get, path: '/api/:apiKey/users', handler: () => 'second' })).toThrow(
        'Route /api/:apiKey/users already exists for method GET',
      );
    });

    it('should integrate with parameter validation (validateParameterNames)', () => {
      const routeRegistry = new RouteRegistry();

      // Integration test: RouteRegistry should call validateParameterNames during registration
      expect(() =>
        routeRegistry.register({
          method: httpMethod.get,
          path: '/users/:id/posts/:id', // Duplicate parameter names
          handler: () => {},
        }),
      ).toThrow('duplicate parameter names');
    });
  });

  describe('Route Priority and Matching', () => {
    it('should prioritize exact routes over parameterized routes', () => {
      const routeRegistry = new RouteRegistry();
      const exactHandler = () => 'exact';
      const paramHandler = () => 'param';

      // Register parameterized route first
      routeRegistry.register({ method: httpMethod.get, path: '/users/:id', handler: paramHandler });

      // Register exact route second
      routeRegistry.register({ method: httpMethod.get, path: '/users/profile', handler: exactHandler });

      // Exact route should win
      const exactMatch = routeRegistry.findRoute(httpMethod.get, '/users/profile');
      expect(exactMatch?.route.handler).toBe(exactHandler);
      expect(exactMatch?.params).toEqual({});

      // Parameterized route should still work for other paths
      const paramMatch = routeRegistry.findRoute(httpMethod.get, '/users/123');
      expect(paramMatch?.route.handler).toBe(paramHandler);
      expect(paramMatch?.params).toEqual({ id: '123' });
    });
  });

  describe('HTTP Method Separation', () => {
    it('should separate routes by HTTP method', () => {
      const routeRegistry = new RouteRegistry();
      const getHandler = () => 'get';
      const postHandler = () => 'post';

      routeRegistry.register({ method: httpMethod.get, path: '/users/:id', handler: getHandler });
      routeRegistry.register({ method: httpMethod.post, path: '/users/:id', handler: postHandler });

      const getMatch = routeRegistry.findRoute(httpMethod.get, '/users/123');
      const postMatch = routeRegistry.findRoute(httpMethod.post, '/users/123');

      expect(getMatch?.route.handler).toBe(getHandler);
      expect(postMatch?.route.handler).toBe(postHandler);
      expect(getMatch?.params).toEqual({ id: '123' });
      expect(postMatch?.params).toEqual({ id: '123' });
    });
  });

  describe('Edge Cases', () => {
    it('should not match empty parameter values', () => {
      const routeRegistry = new RouteRegistry();

      routeRegistry.register({ method: httpMethod.get, path: '/users/:id/posts', handler: () => {} });

      // Empty parameter should not match
      expect(routeRegistry.findRoute(httpMethod.get, '/users//posts')).toBeUndefined();
    });

    it('should integrate with path normalization', () => {
      const routeRegistry = new RouteRegistry();

      // Test that RouteRegistry uses normalizePath internally
      routeRegistry.register({ method: httpMethod.get, path: '//users//:id/', handler: () => {} });

      const match = routeRegistry.findRoute(httpMethod.get, '/users/123');
      expect(match).toBeDefined();
      expect(match?.params).toEqual({ id: '123' });
    });
  });
});
