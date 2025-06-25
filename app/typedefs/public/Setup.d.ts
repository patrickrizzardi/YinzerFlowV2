import type { THttpMethod } from '@typedefs/constants/http.js';
import type { ResponseFunctionResolved, RouteRegistryOptionsResolved, UndefinedResponseFunctionResolved } from '@typedefs/internal/RouteRegistryResolved.js';
import type { SetupMethodResolved } from '@typedefs/internal/SetupResolved.js';
import type { GlobalHookOptionsResolved } from '@typedefs/internal/HookRegistry.js';
import type { RouteResolvedGenerics } from '@typedefs/internal/Generics.js';

export interface Setup {
  get: SetupMethodResolved;
  post: SetupMethodResolved;
  put: SetupMethodResolved;
  patch: SetupMethodResolved;
  delete: SetupMethodResolved;
  options: SetupMethodResolved;
  group: (prefix: string, callback: (group: Record<Lowercase<THttpMethod>, SetupMethodResolved>) => void, options?: RouteRegistryOptionsResolved) => void;
  beforeAll: (handlers: Array<ResponseFunctionResolved | UndefinedResponseFunctionResolved>, options?: GlobalHookOptionsResolved) => void;
  afterAll: (handlers: Array<ResponseFunctionResolved>, options?: GlobalHookOptionsResolved) => void;
  onError: <T extends RouteResolvedGenerics = RouteResolvedGenerics>(handler: ResponseFunctionResolved<T>) => void;
}
