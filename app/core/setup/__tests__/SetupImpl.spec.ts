import { describe, expect, it } from 'bun:test';
import { httpMethod, httpStatus, httpStatusCode } from '@constants/http.ts';
import { SetupImpl } from '@core/setup/SetupImpl.ts';

describe('Setup', () => {
  // Configurations are tested in handleCustomConfiguration.spec.ts

  it('should register routes of each http method', () => {
    const setup = new SetupImpl();
    setup.get('/', () => {}, { beforeHooks: [() => {}], afterHooks: [() => {}] });
    setup.post('/', () => {});
    setup.put('/', () => {});
    setup.patch('/', () => {});
    setup.delete('/', () => {});
    setup.options('/', () => {});
    expect(setup._routeRegistry._findRoute(httpMethod.get, '/')).toBeDefined();
    expect(setup._routeRegistry._findRoute(httpMethod.get, '/')?.route.options.beforeHooks).toBeDefined();
    expect(setup._routeRegistry._findRoute(httpMethod.get, '/')?.route.options.afterHooks).toBeDefined();
    expect(setup._routeRegistry._findRoute(httpMethod.post, '/')).toBeDefined();
    expect(setup._routeRegistry._findRoute(httpMethod.put, '/')).toBeDefined();
    expect(setup._routeRegistry._findRoute(httpMethod.patch, '/')).toBeDefined();
    expect(setup._routeRegistry._findRoute(httpMethod.delete, '/')).toBeDefined();
    expect(setup._routeRegistry._findRoute(httpMethod.options, '/')).toBeDefined();
  });

  it('should register a group of routes', () => {
    const setup = new SetupImpl();
    setup.group('/api', (group) => {
      group.get('/users', () => {});
      group.post('/users', () => {});
    });
    expect(setup._routeRegistry._findRoute(httpMethod.get, '/api/users')).toBeDefined();
    expect(setup._routeRegistry._findRoute(httpMethod.post, '/api/users')).toBeDefined();
  });

  it('should merge group and route hooks in correct execution order', () => {
    const setup = new SetupImpl();
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

    const routeMatch = setup._routeRegistry._findRoute(httpMethod.get, '/api/users');

    // Should be: [groupBefore, routeBefore]
    expect(routeMatch?.route.options.beforeHooks).toEqual([groupBeforeHook, routeBeforeHook]);

    // Should be: [routeAfter, groupAfter]
    expect(routeMatch?.route.options.afterHooks).toEqual([routeAfterHook, groupAfterHook]);
  });

  it('should have beforeAll and afterAll hooks', () => {
    const setup = new SetupImpl();
    const beforeAllHook = () => {};
    const beforeAllHook2 = () => true;
    const afterAllHook = () => {};
    const afterAllHook2 = () => true;
    setup.beforeAll([beforeAllHook], { routesToExclude: [], routesToInclude: [] });
    setup.beforeAll([beforeAllHook2], { routesToExclude: ['/api/users'], routesToInclude: [] });
    setup.afterAll([afterAllHook], { routesToExclude: [], routesToInclude: [] });
    setup.afterAll([afterAllHook2], { routesToExclude: [], routesToInclude: ['/api/users'] });
    expect(setup._hooks._beforeAll.size).toBe(2);
    expect(setup._hooks._afterAll.size).toBe(2);
    expect(setup._hooks._beforeAll).toEqual(
      new Set([
        { handler: beforeAllHook, options: { routesToExclude: [], routesToInclude: [] } },
        { handler: beforeAllHook2, options: { routesToExclude: ['/api/users'], routesToInclude: [] } },
      ]),
    );
    expect(setup._hooks._afterAll).toEqual(
      new Set([
        { handler: afterAllHook, options: { routesToExclude: [], routesToInclude: [] } },
        { handler: afterAllHook2, options: { routesToInclude: ['/api/users'], routesToExclude: [] } },
      ]),
    );
  });

  it('should have onError hook', () => {
    const setup = new SetupImpl();
    expect(setup._hooks._onError).toBeDefined();
    expect(setup._hooks._onError).toBeInstanceOf(Function);
  });

  it('should override onError hook', () => {
    const setup = new SetupImpl();
    const onErrorHook = () => {
      return {
        statusCode: httpStatusCode.internalServerError,
        status: httpStatus.internalServerError,
        headers: {},
        body: 'This is a custom onError hook',
      };
    };
    setup.onError(onErrorHook);
    expect(setup._hooks._onError).toEqual(onErrorHook);
  });
});
