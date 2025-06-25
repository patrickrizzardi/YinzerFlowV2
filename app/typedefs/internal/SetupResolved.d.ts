import type { RouteResolvedGenerics } from '@typedefs/internal/Generics.js';
import type { ResponseFunctionResolved, RouteRegistryOptionsResolved } from '@typedefs/internal/RouteRegistryResolved.js';

export type SetupMethodResolved = <T extends RouteResolvedGenerics = RouteResolvedGenerics>(
  path: string,
  handler: ResponseFunctionResolved<T>,
  options?: RouteRegistryOptionsResolved,
) => void;
