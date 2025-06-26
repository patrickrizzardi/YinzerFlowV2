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

  constructor(rawRequest: Request['rawBody'], setup: SetupImpl) {
    this._rawRequest = rawRequest;
    this._setup = setup;

    const { method, path, protocol, headers, body, query, params, ipAddress, rawBody } = this._parseRequestIntoObject();

    this.method = method;
    this.path = path;
    this.protocol = protocol;
    this.headers = headers;
    this.body = body;
    this.query = query;
    this.params = params;
    this.ipAddress = ipAddress;
    this.rawBody = rawBody;
  }

  private _parseRequestIntoObject(): Request {
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
      ipAddress: parseIpAddress(this._setup, headers),
      rawBody,
    };
  }
}
