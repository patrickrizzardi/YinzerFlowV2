import { parseBody } from './utils/parseBody.ts';
import type { TContentType, THttpHeaders, THttpMethod } from '@typedefs/constants/http.js';
import { parseHttpRequest } from '@core/execution/utils/parseHttpRequest.ts';
import { parseQuery } from '@core/execution/utils/parseQuery.ts';
import { parseIpAddress } from '@core/execution/utils/parseIpAddress.ts';
import { extractBoundaryFromHeader } from '@core/execution/utils/extractBoundaryFromHeader.ts';
import { parseHeaders } from '@core/execution/utils/parseHeaders.ts';
import type { Request } from '@typedefs/public/Request.ts';
import type { SetupImpl } from '@core/setup/SetupImpl.ts';
import type { InternalRequestImpl } from '@typedefs/internal/InternalRequestImpl.ts';
import type { InternalSetupImpl } from '@typedefs/internal/InternalSetupImpl.ts';

export class RequestImpl implements InternalRequestImpl {
  readonly _rawRequest: Buffer | string;
  readonly _setup: InternalSetupImpl;

  method: THttpMethod;
  path: string;
  protocol: string;
  headers: Partial<Record<THttpHeaders, string>>;
  body: unknown;
  query: Record<string, string>;
  params: Record<string, string>;
  ipAddress: string;
  rawBody: Buffer | string;

  constructor(rawRequest: Request['rawBody'], setup: SetupImpl, clientAddress?: string) {
    this._rawRequest = rawRequest;
    this._setup = setup;

    // Set initial IP address from socket, will be updated if headers provide better info
    this.ipAddress = clientAddress ?? '';

    const { method, path, protocol, headers, body, query, params, rawBody } = this._parseRequestIntoObject();

    this.method = method;
    this.path = path;
    this.protocol = protocol;
    this.headers = headers;
    this.body = body;
    this.query = query;
    this.params = params;
    this.rawBody = rawBody;

    // Update IP address if parsing from headers provides something
    const parsedIpAddress = parseIpAddress(this._setup, headers);
    if (parsedIpAddress) {
      this.ipAddress = parsedIpAddress;
    }
  }

  private _parseRequestIntoObject(): Omit<Request, 'ipAddress'> {
    const request = this._rawRequest.toString();

    const { method, path, protocol, headersRaw, rawBody } = parseHttpRequest(request);

    const route = this._setup._routeRegistry._findRoute(method, path);
    const headers = parseHeaders(headersRaw);

    // Extract content type and boundary for body parsing
    const contentTypeHeader = headers['content-type'];
    const mainContentType = contentTypeHeader?.split(';')[0]?.trim().toLowerCase() as TContentType | undefined;
    const boundary = extractBoundaryFromHeader(contentTypeHeader);

    return {
      method,
      path,
      protocol,
      headers,
      body: parseBody(rawBody, mainContentType, boundary),
      query: parseQuery(path),
      params: route?.params ?? {},
      rawBody,
    };
  }
}
