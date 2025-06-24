import type { IResponse } from '@typedefs/core/Context.js';

export interface IResponseBuilder {
  getResponse: () => IResponse;
}
