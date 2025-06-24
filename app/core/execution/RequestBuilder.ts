import { parseBody } from './utils/parseBody.ts';
import type { IRequest } from '@typedefs/core/Context.js';
import type { TContentType } from '@typedefs/constants/http.js';
import type { Setup } from '@core/setup/Setup.ts';
import { parseHttpRequest } from '@core/execution/utils/parseHttpRequest.ts';
import { parseQuery } from '@core/execution/utils/parseQuery.ts';
import { parseIpAddress } from '@core/execution/utils/parseIpAddress.ts';
import { extractBoundaryFromHeader } from '@core/execution/utils/extractBoundaryFromHeader.ts';
import { parseHeaders } from '@core/execution/utils/parseHeaders.ts';

export class RequestBuilder {
  private readonly request: IRequest;

  constructor(rawRequest: Buffer, setup: Setup) {
    this.request = this.buildRequest(rawRequest, setup);
  }

  /**
   * @internal
   * Build the request object
   *
   * @example
   * ```typescript
   * const request = builder.buildRequest(rawRequest, setup);
   * ```
   */
  private buildRequest(rawRequest: Buffer, setup: Setup): IRequest {
    const request = rawRequest.toString();

    const { method, path, protocol, headersRaw, rawBody } = parseHttpRequest(request);

    const route = setup.getRouteRegistry().findRoute(method, path);
    const headers = parseHeaders(headersRaw);

    // Extract content type and boundary for body parsing
    const contentTypeHeader = headers['content-type'];
    const mainContentType = contentTypeHeader?.split(';')[0]?.trim().toLowerCase() as TContentType | undefined;
    const boundary = extractBoundaryFromHeader(contentTypeHeader);

    /**
     * If the route or setup has a rawBody option, we do not parse the body
     * If the route is not defined, we use the setup's rawBody option
     */
    const doNotParseBody = route?.route.options?.rawBody ?? setup.getConfiguration().rawBody;

    return {
      method,
      path,
      protocol,
      headers,
      body: doNotParseBody ? rawBody : parseBody(rawBody, mainContentType, boundary),
      query: parseQuery(path),
      params: route?.params ?? {},
      ipAddress: parseIpAddress(setup, headers),
    };
  }

  /**
   * @internal
   * Get the request object
   *
   * @example
   * ```typescript
   * const request = builder.getRequest();
   * ```
   */
  getRequest(): IRequest {
    return this.request;
  }
}
