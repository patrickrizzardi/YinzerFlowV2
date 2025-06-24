export interface IResponseBuilder {
  setStatusCode: (statusCode: THttpStatusCode) => void;
  addHeaders: (headers: Record<THttpHeaders, string>) => void;
  removeHeaders: (headerNames: Array<THttpHeaders>) => void;
}
