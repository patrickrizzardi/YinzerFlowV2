import type { THttpMethod } from '@typedefs/constants/http.js';
import type { InternalSetupMethod } from '@typedefs/internal/InternalSetupImpl.d.ts';
import type { GlobalHookOptionsResolved } from '@typedefs/internal/InternalHookRegistryImpl.js';
import type { HandlerCallback } from '@typedefs/public/Context.js';

export interface Setup {
  get: InternalSetupMethod;
  post: InternalSetupMethod;
  put: InternalSetupMethod;
  patch: InternalSetupMethod;
  delete: InternalSetupMethod;
  options: InternalSetupMethod;
  group: (prefix: string, callback: (group: Record<Lowercase<THttpMethod>, SetupMethodResolved>) => void, options?: RouteRegistryOptionsResolved) => void;
  beforeAll: (handlers: Array<HandlerCallback>, options?: GlobalHookOptionsResolved) => void;
  afterAll: (handlers: Array<HandlerCallback>, options?: GlobalHookOptionsResolved) => void;
  onError: (handler: HandlerCallback) => void;
  onNotFound: (handler: HandlerCallback) => void;
}
