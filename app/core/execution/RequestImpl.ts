import { parseBody } from './utils/parseBody.ts';
import type { TContentType, THttpHeaders, THttpMethod } from '@typedefs/constants/http.js';
import { parseHttpRequest } from '@core/execution/utils/parseHttpRequest.ts';
import { parseQuery } from '@core/execution/utils/parseQuery.ts';
import { parseIpAddress } from '@core/execution/utils/parseIpAddress.ts';
import { extractBoundaryFromHeader } from '@core/execution/utils/extractBoundaryFromHeader.ts';
import { parseHeaders } from '@core/execution/utils/parseHeaders.ts';
import type { Request } from '@typedefs/public/Request.ts';
import type { SetupImpl } from '@core/setup/Setup.ts';

export class RequestImpl {
  private readonly rawRequest: Request['rawBody'];
  private readonly setup: SetupImpl;

  method: THttpMethod;
  path: string;
  protocol: string;
  headers: Partial<Record<THttpHeaders, string>>;
  body: Request['body'];
  query: Request['query'];
  params: Request['params'];
  ipAddress: string;
  rawBody: Request['rawBody'];

  constructor(rawRequest: Request['rawBody'], setup: SetupImpl) {
    this.rawRequest = rawRequest;
    this.setup = setup;

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
    const request = this.rawRequest.toString();

    const { method, path, protocol, headersRaw, rawBody } = parseHttpRequest(request);

    const route = this.setup._routeRegistry.findRoute(method, path);
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
      ipAddress: parseIpAddress(this.setup, headers),
      rawBody,
    };
  }
}
