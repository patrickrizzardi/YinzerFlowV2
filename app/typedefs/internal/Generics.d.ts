export type CreateEnum<T> = T[keyof T];

export interface InternalHandlerCallbackGenerics {
  body: unknown;
  response: unknown;
  query: Record<string, string>;
  params: Record<string, string>;
}
