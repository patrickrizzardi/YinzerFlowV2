import { describe, expect, it } from 'bun:test';
import { httpMethod } from 'constants/http.ts';
import { RouteRegistry } from 'core/setup/RouteRegistry.ts';

describe('RouteRegistry', () => {
  it('should register a route', () => {
    const routeRegistry = new RouteRegistry();
    routeRegistry.register({ method: httpMethod.get, path: '/', handler: () => {} });
    expect(routeRegistry.findRoute(httpMethod.get, '/')).toBeDefined();
  });

  it('should throw an error if a route already exists', () => {
    const routeRegistry = new RouteRegistry();
    routeRegistry.register({ method: httpMethod.get, path: '/', handler: () => {} });
    expect(() => routeRegistry.register({ method: httpMethod.get, path: '/', handler: () => {} })).toThrow();
  });

  it('should normalize the path', () => {
    const routeRegistry = new RouteRegistry();
    routeRegistry.register({ method: httpMethod.get, path: '//double-slash', handler: () => {} });
    routeRegistry.register({ method: httpMethod.get, path: 'no-leading-slash', handler: () => {} });
    expect(routeRegistry.findRoute(httpMethod.get, '/double-slash')).toBeDefined();
    expect(routeRegistry.findRoute(httpMethod.get, '/no-leading-slash')).toBeDefined();
  });
});
