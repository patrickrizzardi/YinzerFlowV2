import type { THttpHeaders, THttpMethod } from '@typedefs/constants/http.js';
import type { InternalHandlerCallbackGenerics } from '@typedefs/internal/Generics.d.ts';

export interface Request<T = InternalHandlerCallbackGenerics> {
  protocol: string;
  method: THttpMethod;
  path: string;
  headers: Partial<Record<THttpHeaders, string>>;
  body: T['body'];
  query: T['query'];
  params: T['params'];
  ipAddress: string; // The ip address of the client (Configure proxy hops if behind a proxy, load balancer, etc.)
  rawBody: Buffer | string; // The raw body of the request. Useful for parsing the body manually.
}
