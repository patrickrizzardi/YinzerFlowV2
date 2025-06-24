import { describe, expect, it } from 'bun:test';
import { RequestBuilder } from '@core/execution/RequestBuilder.ts';
import { Setup } from '@core/setup/Setup.ts';
import { parseHttpRequest } from '@core/execution/utils/parseHttpRequest.ts';

describe('RequestBuilder', () => {
  const rawRequest = new Buffer('GET / HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\n\r\n{"name": "John", "age": 30}');

  it('should build a request', () => {
    const request = new RequestBuilder(rawRequest, new Setup());
    expect(request).toBeDefined();
  });

  it('should return a raw body when server config specifies', () => {
    const request = new RequestBuilder(rawRequest, new Setup({ rawBody: true }));
    expect(request).toBeDefined();
    expect(request.getRequest().body).toBeDefined();

    const { rawBody } = parseHttpRequest(rawRequest.toString());
    expect(request.getRequest().body).toBe(rawBody);
  });
});
