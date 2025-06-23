import { describe, expect, it } from 'bun:test';
import { httpMethod, httpStatus, httpStatusCode } from '@constants/http.ts';
import { Setup } from '@core/setup/Setup.ts';
import type { IContext } from '@typedefs/core/Context.js';

describe('Setup', () => {
  it('should have a default configuration', () => {
    const setup = new Setup();
    expect(setup.getConfiguration()).toBeDefined();
  });

  it('should override the default configuration keeping default values that are not provided', () => {
    const setup = new Setup({
      port: 3001,
      proxyHops: 1,
    });
    expect(setup.getConfiguration().port).toBe(3001);
    expect(setup.getConfiguration().proxyHops).toBe(1);
  });

  it('should register routes of each http method', () => {
    const setup = new Setup();
    setup.get('/', () => {}, { beforeHooks: [() => {}], afterHooks: [() => {}] });
    setup.post('/', () => {});
    setup.put('/', () => {});
    setup.patch('/', () => {});
    setup.delete('/', () => {});
    setup.options('/', () => {});
    expect(setup.getRouteRegistry().findRoute(httpMethod.get, '/')).toBeDefined();
    expect(setup.getRouteRegistry().findRoute(httpMethod.get, '/')?.options?.beforeHooks).toBeDefined();
    expect(setup.getRouteRegistry().findRoute(httpMethod.get, '/')?.options?.afterHooks).toBeDefined();
    expect(setup.getRouteRegistry().findRoute(httpMethod.post, '/')).toBeDefined();
    expect(setup.getRouteRegistry().findRoute(httpMethod.put, '/')).toBeDefined();
    expect(setup.getRouteRegistry().findRoute(httpMethod.patch, '/')).toBeDefined();
    expect(setup.getRouteRegistry().findRoute(httpMethod.delete, '/')).toBeDefined();
    expect(setup.getRouteRegistry().findRoute(httpMethod.options, '/')).toBeDefined();
  });

  it('should register a group of routes', () => {
    const setup = new Setup();
    setup.group('/api', (group) => {
      group.get('/users', () => {});
      group.post('/users', () => {});
    });
    expect(setup.getRouteRegistry().findRoute(httpMethod.get, '/api/users')).toBeDefined();
    expect(setup.getRouteRegistry().findRoute(httpMethod.post, '/api/users')).toBeDefined();
  });

  it('should merge group and route hooks in correct execution order', () => {
    const setup = new Setup();
    const executionOrder: Array<string> = [];

    const groupBeforeHook = () => executionOrder.push('beforeGroup');
    const routeBeforeHook = () => executionOrder.push('beforeRoute');
    const routeAfterHook = () => executionOrder.push('afterRoute');
    const groupAfterHook = () => executionOrder.push('afterGroup');

    setup.group(
      '/api',
      (group) => {
        group.get('/users', () => executionOrder.push('handler'), {
          beforeHooks: [routeBeforeHook],
          afterHooks: [routeAfterHook],
        });
      },
      {
        beforeHooks: [groupBeforeHook],
        afterHooks: [groupAfterHook],
      },
    );

    const route = setup.getRouteRegistry().findRoute(httpMethod.get, '/api/users');

    // Should be: [groupBefore, routeBefore]
    expect(route?.options?.beforeHooks).toEqual([groupBeforeHook, routeBeforeHook]);

    // Should be: [routeAfter, groupAfter]
    expect(route?.options?.afterHooks).toEqual([routeAfterHook, groupAfterHook]);
  });

  it('should have beforeAll and afterAll hooks', () => {
    const setup = new Setup();
    const beforeAllHook = () => {};
    const beforeAllHook2 = () => true;
    const afterAllHook = () => {};
    const afterAllHook2 = () => true;
    setup.beforeAll(beforeAllHook, {});
    setup.beforeAll(beforeAllHook2, { routesToExclude: ['/api/users'] });
    setup.afterAll(afterAllHook, {});
    setup.afterAll(afterAllHook2, { routesToInclude: ['/api/users'] });
    expect(setup.getHooks().beforeAll.size).toBe(2);
    expect(setup.getHooks().afterAll.size).toBe(2);
    expect(setup.getHooks().beforeAll).toEqual(
      new Set([
        { handler: beforeAllHook, options: {} },
        { handler: beforeAllHook2, options: { routesToExclude: ['/api/users'] } },
      ]),
    );
    expect(setup.getHooks().afterAll).toEqual(
      new Set([
        { handler: afterAllHook, options: {} },
        { handler: afterAllHook2, options: { routesToInclude: ['/api/users'] } },
      ]),
    );
  });

  it('should have onError hook', () => {
    const setup = new Setup();
    expect(setup.getHooks().onError).toBeDefined();
    expect(setup.getHooks().onError).toBeInstanceOf(Function);
  });

  it('should override onError hook', () => {
    const setup = new Setup();
    const onErrorHook = (ctx: IContext) => {
      console.error(ctx.response.body);
      return {
        statusCode: httpStatusCode.internalServerError,
        status: httpStatus.internalServerError,
        headers: {},
        body: 'This is a custom onError hook',
      };
    };
    setup.onError(onErrorHook);
    expect(setup.getHooks().onError).toEqual(onErrorHook);
  });
});
