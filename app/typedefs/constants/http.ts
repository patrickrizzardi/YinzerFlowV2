import type { CreateEnum } from 'typedefs/generic.typedefs.ts';
import type { contentType, httpHeaders, httpMethod, httpStatus, httpStatusCode } from 'constants/http.ts';

export type THttpStatus = CreateEnum<typeof httpStatus>;
export type THttpStatusCode = CreateEnum<typeof httpStatusCode>;
export type THttpMethod = CreateEnum<typeof httpMethod>;
export type TContentType = CreateEnum<typeof contentType>;

export type THttpHeaders = CreateEnum<typeof httpHeaders>;
