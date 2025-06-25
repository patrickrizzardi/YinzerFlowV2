import type { THttpHeaders, THttpMethod } from '@typedefs/constants/http.js';

export interface Request {
  protocol: string;
  method: THttpMethod;
  path: string;
  headers: Partial<Record<THttpHeaders, string>>;
  body: unknown;
  query: Record<string, string>;
  params: Record<string, string>;
  ipAddress: string; // The ip address of the client (Configure proxy hops if behind a proxy, load balancer, etc.)
  rawBody: Buffer | string; // The raw body of the request. Useful for parsing the body manually.
}
