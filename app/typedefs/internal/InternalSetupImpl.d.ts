import type { HandlerCallback } from '@typedefs/public/Context.d.ts';
import type { InternalHookRegistryImpl } from '@typedefs/internal/InternalHookRegistryImpl.js';
import type { InternalRouteRegistryImpl, InternalRouteRegistryOptions } from '@typedefs/internal/InternalRouteRegistryImpl.js';
import type { ServerConfiguration } from '@typedefs/public/Configuration.js';
import type { Setup } from '@typedefs/public/Setup.js';

export type InternalSetupMethod = (path: string, handler: HandlerCallback, options?: InternalRouteRegistryOptions) => void;

export interface InternalSetupImpl extends Setup {
  readonly _configuration: ServerConfiguration;
  readonly _routeRegistry: InternalRouteRegistryImpl;
  readonly _hooks: InternalHookRegistryImpl;
}
