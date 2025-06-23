import type { TResponseFunction, TUndefinableResponseFunction } from '@typedefs/core/Context.js';

export type TBeforeHookResponse = TResponseFunction | TUndefinableResponseFunction;
export type TAfterHookResponse = TResponseFunction;

export type IHookOptions = {
  routesToExclude?: Array<string>;
} & {
  routesToInclude?: Array<string>;
};

export interface IHookRegistry {
  beforeAll: Set<{
    handler: TBeforeHookResponse;
    options?: IHookOptions | undefined;
  }>;
  afterAll: Set<{
    handler: TAfterHookResponse;
    options?: IHookOptions | undefined;
  }>;
  onError: TResponseFunction;
}
