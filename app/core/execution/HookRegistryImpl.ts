import type { InternalGlobalHookOptions, InternalHookRegistryImpl } from '@typedefs/internal/InternalHookRegistryImpl.js';
import type { HandlerCallback } from '@typedefs/public/Context.js';

export class HookRegistryImpl implements InternalHookRegistryImpl {
  readonly _beforeAll: Set<{
    handler: HandlerCallback;
    options?: InternalGlobalHookOptions;
  }>;
  readonly _afterAll: Set<{
    handler: HandlerCallback;
    options?: InternalGlobalHookOptions;
  }>;
  _onError: HandlerCallback;

  constructor() {
    this._beforeAll = new Set();
    this._afterAll = new Set();
    this._onError = (ctx): unknown => {
      ctx.response.setStatusCode(500);
      return { success: false, message: 'Internal Server Error' };
    };
  }

  _addBeforeHooks(handlers: Array<HandlerCallback>, options?: InternalGlobalHookOptions): void {
    for (const handler of handlers) this._beforeAll.add({ handler, options: options ?? { routesToExclude: [], routesToInclude: [] } });
  }

  _addAfterHooks(handlers: Array<HandlerCallback>, options?: InternalGlobalHookOptions): void {
    for (const handler of handlers) this._afterAll.add({ handler, options: options ?? { routesToExclude: [], routesToInclude: [] } });
  }

  _addOnError(handler: HandlerCallback): void {
    this._onError = handler;
  }
}
