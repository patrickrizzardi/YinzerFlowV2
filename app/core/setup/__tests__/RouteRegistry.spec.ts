import { describe, expect, it } from 'bun:test';
import { httpMethod } from '@constants/http.ts';
import { RouteRegistryImpl } from '@core/setup/RouteRegistryImpl.ts';

describe('RouteRegistry', () => {
  describe('Exact Routes (no parameters)', () => {
    it('should register and find exact routes', () => {
      const routeRegistry = new RouteRegistryImpl();
      const handler = () => {};

      routeRegistry._register({ method: httpMethod.get, path: '/', handler, options: { beforeHooks: [], afterHooks: [] } });

      const match = routeRegistry._findRoute(httpMethod.get, '/');
      expect(match).toBeDefined();
      expect(match?.route.handler).toBe(handler);
      expect(match?.params).toEqual({});
    });

    it('should throw an error if an exact route already exists', () => {
      const routeRegistry = new RouteRegistryImpl();

      routeRegistry._register({ method: httpMethod.get, path: '/', handler: () => {}, options: { beforeHooks: [], afterHooks: [] } });

      expect(() => routeRegistry._register({ method: httpMethod.get, path: '/', handler: () => {}, options: { beforeHooks: [], afterHooks: [] } })).toThrow(
        'Route / already exists for method GET',
      );
    });
  });

  describe('Parameterized Routes', () => {
    it('should register and find routes with single parameter', () => {
      const routeRegistry = new RouteRegistryImpl();
      const handler = () => {};

      routeRegistry._register({ method: httpMethod.get, path: '/users/:id', handler, options: { beforeHooks: [], afterHooks: [] } });

      const match = routeRegistry._findRoute(httpMethod.get, '/users/123');
      expect(match).toBeDefined();
      expect(match?.route.handler).toBe(handler);
      expect(match?.params).toEqual({ id: '123' });
    });

    it('should extract multiple parameters correctly', () => {
      const routeRegistry = new RouteRegistryImpl();

      routeRegistry._register({
        method: httpMethod.get,
        path: '/users/:userId/posts/:postId',
        handler: () => {},
        options: { beforeHooks: [], afterHooks: [] },
      });

      const match = routeRegistry._findRoute(httpMethod.get, '/users/123/posts/456');
      expect(match).toBeDefined();
      expect(match?.params).toEqual({ userId: '123', postId: '456' });
    });

    it('should handle complex parameter patterns (non-numeric)', () => {
      const routeRegistry = new RouteRegistryImpl();

      routeRegistry._register({
        method: httpMethod.get,
        path: '/api/v1/users/:id/posts/:postId/comments/:commentId',
        handler: () => {},
        options: { beforeHooks: [], afterHooks: [] },
      });

      const match = routeRegistry._findRoute(httpMethod.get, '/api/v1/users/user123/posts/post456/comments/comment789');
      expect(match).toBeDefined();
      expect(match?.params).toEqual({
        id: 'user123',
        postId: 'post456',
        commentId: 'comment789',
      });
    });

    it('should not match if path structure is different', () => {
      const routeRegistry = new RouteRegistryImpl();

      routeRegistry._register({
        method: httpMethod.get,
        path: '/users/:id/posts/:postId',
        handler: () => {},
        options: { beforeHooks: [], afterHooks: [] },
      });

      // Too few segments
      expect(routeRegistry._findRoute(httpMethod.get, '/users/123')).toBeUndefined();

      // Too many segments
      expect(routeRegistry._findRoute(httpMethod.get, '/users/123/posts/456/extra')).toBeUndefined();

      // Different structure
      expect(routeRegistry._findRoute(httpMethod.get, '/posts/123/users/456')).toBeUndefined();
    });

    it('should throw error if parameterized route pattern already exists', () => {
      const routeRegistry = new RouteRegistryImpl();

      routeRegistry._register({ method: httpMethod.get, path: '/users/:id', handler: () => {}, options: { beforeHooks: [], afterHooks: [] } });

      expect(() =>
        routeRegistry._register({ method: httpMethod.get, path: '/users/:userId', handler: () => {}, options: { beforeHooks: [], afterHooks: [] } }),
      ).toThrow('Route /users/:userId already exists for method GET');
    });

    it('should prevent conflicting parameterized route structures', () => {
      const routeRegistry = new RouteRegistryImpl();

      routeRegistry._register({ method: httpMethod.get, path: '/api/:version/users', handler: () => 'first', options: { beforeHooks: [], afterHooks: [] } });

      // Should throw error when trying to register a route with same structure but different param name
      expect(() =>
        routeRegistry._register({ method: httpMethod.get, path: '/api/:apiKey/users', handler: () => 'second', options: { beforeHooks: [], afterHooks: [] } }),
      ).toThrow('Route /api/:apiKey/users already exists for method GET');
    });

    it('should integrate with parameter validation (validateParameterNames)', () => {
      const routeRegistry = new RouteRegistryImpl();

      // Integration test: RouteRegistry should call validateParameterNames during registration
      expect(() =>
        routeRegistry._register({
          method: httpMethod.get,
          path: '/users/:id/posts/:id', // Duplicate parameter names
          handler: () => {},
          options: { beforeHooks: [], afterHooks: [] },
        }),
      ).toThrow('duplicate parameter names');
    });
  });

  describe('Route Priority and Matching', () => {
    it('should prioritize exact routes over parameterized routes', () => {
      const routeRegistry = new RouteRegistryImpl();
      const exactHandler = () => 'exact';
      const paramHandler = () => 'param';

      // Register parameterized route first
      routeRegistry._register({ method: httpMethod.get, path: '/users/:id', handler: paramHandler, options: { beforeHooks: [], afterHooks: [] } });

      // Register exact route second
      routeRegistry._register({ method: httpMethod.get, path: '/users/profile', handler: exactHandler, options: { beforeHooks: [], afterHooks: [] } });

      // Exact route should win
      const exactMatch = routeRegistry._findRoute(httpMethod.get, '/users/profile');
      expect(exactMatch?.route.handler).toBe(exactHandler);
      expect(exactMatch?.params).toEqual({});

      // Parameterized route should still work for other paths
      const paramMatch = routeRegistry._findRoute(httpMethod.get, '/users/123');
      expect(paramMatch?.route.handler).toBe(paramHandler);
      expect(paramMatch?.params).toEqual({ id: '123' });
    });
  });

  describe('HTTP Method Separation', () => {
    it('should separate routes by HTTP method', () => {
      const routeRegistry = new RouteRegistryImpl();
      const getHandler = () => 'get';
      const postHandler = () => 'post';

      routeRegistry._register({ method: httpMethod.get, path: '/users/:id', handler: getHandler, options: { beforeHooks: [], afterHooks: [] } });
      routeRegistry._register({ method: httpMethod.post, path: '/users/:id', handler: postHandler, options: { beforeHooks: [], afterHooks: [] } });

      const getMatch = routeRegistry._findRoute(httpMethod.get, '/users/123');
      const postMatch = routeRegistry._findRoute(httpMethod.post, '/users/123');

      expect(getMatch?.route.handler).toBe(getHandler);
      expect(postMatch?.route.handler).toBe(postHandler);
      expect(getMatch?.params).toEqual({ id: '123' });
      expect(postMatch?.params).toEqual({ id: '123' });
    });
  });

  describe('Edge Cases', () => {
    it('should not match empty parameter values', () => {
      const routeRegistry = new RouteRegistryImpl();

      routeRegistry._register({ method: httpMethod.get, path: '/users/:id/posts', handler: () => {}, options: { beforeHooks: [], afterHooks: [] } });

      // Empty parameter should not match
      expect(routeRegistry._findRoute(httpMethod.get, '/users//posts')).toBeUndefined();
    });

    it('should integrate with path normalization', () => {
      const routeRegistry = new RouteRegistryImpl();

      // Test that RouteRegistry uses normalizePath internally
      routeRegistry._register({ method: httpMethod.get, path: '//users//:id/', handler: () => {}, options: { beforeHooks: [], afterHooks: [] } });

      const match = routeRegistry._findRoute(httpMethod.get, '/users/123');
      expect(match).toBeDefined();
      expect(match?.params).toEqual({ id: '123' });
    });
  });
});
