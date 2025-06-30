import { httpHeaders } from '@constants/http.ts';
import type { InternalContextImpl } from '@typedefs/internal/InternalContextImpl.js';
import type { CorsConfiguration, CorsEnabledConfiguration } from '@typedefs/public/Configuration.js';

export const handleCors = (context: InternalContextImpl, config: CorsConfiguration): boolean => {
  if (!config.enabled) return false;

  if (context.request.method === 'OPTIONS') {
    // Validate origin is accepted
    _validateOrigin(context, config);

    // Set response headers
    context.response.setStatusCode(config.optionsSuccessStatus);

    // Configure allowed methods and headers
    context._response._setHeadersIfNotSet({
      [httpHeaders.accessControlAllowOrigin]: context.request.headers.origin ?? '*',
      [httpHeaders.accessControlAllowMethods]: config.methods.join(', '),
      [httpHeaders.accessControlAllowHeaders]: typeof config.allowedHeaders === 'string' ? config.allowedHeaders : config.allowedHeaders.join(', '),
      [httpHeaders.accessControlAllowCredentials]: config.credentials ? 'true' : 'false',
      [httpHeaders.accessControlExposeHeaders]: config.exposedHeaders.join(', '),
      [httpHeaders.accessControlMaxAge]: config.maxAge.toString(),
    });

    // If preflightContinue is true, return true to indicate that the request was handled
    if (config.preflightContinue) return true;

    // Set body to empty string if preflightContinue is false
    context._response._setBody('');
    return false;
  }

  return true;
};

const _validateOrigin = (context: InternalContextImpl, config: CorsEnabledConfiguration): boolean => {
  if (config.origin === '*') return true;

  const normalizedOrigin = context.request.headers.origin?.toLowerCase() ?? '';

  if (typeof config.origin === 'function') {
    return Boolean(config.origin(normalizedOrigin, context.request));
  }

  if (typeof config.origin === 'string') {
    return normalizedOrigin === config.origin.toLowerCase();
  }

  if (Array.isArray(config.origin)) {
    return config.origin.some((origin) => normalizedOrigin === origin.toLowerCase());
  }

  if (config.origin instanceof RegExp) {
    return config.origin.test(normalizedOrigin);
  }

  return false;
};
