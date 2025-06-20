import type { CreateEnum } from 'typedefs/generic.ts';
import type { contentType, httpHeaders, httpMethod, httpStatus, httpStatusCode } from 'constants/http.ts';

export type HttpStatus = CreateEnum<typeof httpStatus>;
export type HttpStatusCode = CreateEnum<typeof httpStatusCode>;
export type HttpMethod = CreateEnum<typeof httpMethod>;
export type ContentType = CreateEnum<typeof contentType>;

export type HttpHeaders = CreateEnum<typeof httpHeaders>;
