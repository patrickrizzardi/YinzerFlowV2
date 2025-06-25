import type { GlobalHookOptionsResolved } from '@typedefs/internal/HookRegistry.js';
import type { ResponseFunctionResolved, UndefinedResponseFunctionResolved } from '@typedefs/internal/RouteRegistryResolved.js';

export class HookRegistry {
  readonly _beforeAll: Set<{
    handler: ResponseFunctionResolved | UndefinedResponseFunctionResolved;
    options?: GlobalHookOptionsResolved | undefined;
  }>;
  readonly _afterAll: Set<{
    handler: ResponseFunctionResolved;
    options?: GlobalHookOptionsResolved | undefined;
  }>;
  _onError: ResponseFunctionResolved;

  constructor() {
    this._beforeAll = new Set();
    this._afterAll = new Set();
    this._onError = (ctx): unknown => {
      ctx.response.setStatusCode(500);
      return { success: false, message: 'Internal Server Error' };
    };
  }

  _addBeforeHooks(handlers: Array<ResponseFunctionResolved | UndefinedResponseFunctionResolved>, options?: GlobalHookOptionsResolved): void {
    for (const handler of handlers) this._beforeAll.add({ handler, options });
  }

  _addAfterHooks(handlers: Array<ResponseFunctionResolved>, options?: GlobalHookOptionsResolved): void {
    for (const handler of handlers) this._afterAll.add({ handler, options });
  }

  _addOnError(handler: ResponseFunctionResolved): void {
    this._onError = handler;
  }
}
