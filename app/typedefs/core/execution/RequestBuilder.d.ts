import type { IRequest } from '@typedefs/core/Context.js';

export interface IRequestBuilder {
  getRequest: () => IRequest;
}
