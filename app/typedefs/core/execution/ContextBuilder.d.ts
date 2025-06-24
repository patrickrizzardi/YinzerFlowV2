import type { IContext } from '@typedefs/core/Context.js';

export interface IContextBuilder {
  getContext: () => IContext;
}
