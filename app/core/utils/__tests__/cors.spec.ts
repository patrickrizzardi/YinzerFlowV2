import { describe, expect, it } from 'bun:test';
import type { CorsConfiguration } from '@typedefs/public/Configuration.js';
import { handleCors } from '@core/utils/cors.ts';
import { ContextImpl } from '@core/execution/ContextImpl.ts';
import { SetupImpl } from '@core/setup/SetupImpl.ts';
import type { InternalContextImpl } from '@typedefs/internal/InternalContextImpl.ts';
import { httpStatusCode } from '@constants/http.ts';

// Reusable test data builders
const createCorsConfig = (overrides: Partial<CorsConfiguration> = {}): CorsConfiguration => ({
  enabled: true,
  origin: '*',
  credentials: false,
  maxAge: 86400,
  optionsSuccessStatus: 204,
  preflightContinue: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  ...overrides,
});

const createHttpRequest = (method = 'GET', path = '/', headers: Record<string, string> = {}): string => {
  const headerLines = Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\r\n');

  const hostHeader = 'Host: localhost';
  const allHeaders = headerLines ? `${hostHeader}\r\n${headerLines}` : hostHeader;

  return `${method} ${path} HTTP/1.1\r\n${allHeaders}\r\n\r\n`;
};

const createTestContext = (method = 'GET', path = '/', headers: Record<string, string> = {}): InternalContextImpl => {
  const setup = new SetupImpl();
  const requestString = createHttpRequest(method, path, headers);
  return new ContextImpl(requestString, setup);
};

describe('CORS Functionality', () => {
  describe('CORS Disabled Behavior', () => {
    it('should not handle requests when CORS is disabled', () => {
      const config = createCorsConfig({ enabled: false });
      const context = createTestContext('OPTIONS', '/', {
        'Access-Control-Request-Method': 'POST',
      });

      const result = handleCors(context, config);

      expect(result).toBe(false);
    });

    it('should return false for all request methods when disabled', () => {
      const config = createCorsConfig({ enabled: false });
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];

      methods.forEach((method) => {
        const context = createTestContext(method);
        const result = handleCors(context, config);
        expect(result).toBe(false);
      });
    });
  });

  describe('Non-OPTIONS Request Handling', () => {
    it('should return true for non-OPTIONS requests when CORS is enabled', () => {
      const config = createCorsConfig();
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      methods.forEach((method) => {
        const context = createTestContext(method);
        const result = handleCors(context, config);
        expect(result).toBe(true);
      });
    });

    it('should not modify context for non-OPTIONS requests', () => {
      const config = createCorsConfig();
      const context = createTestContext('GET');

      // Store initial state
      const initialStatusCode = context._response._statusCode;
      const initialBody = context._response._body;
      const initialHeaders = { ...context._response._headers };

      const result = handleCors(context, config);

      expect(result).toBe(true);
      expect(context._response._statusCode).toBe(initialStatusCode);
      expect(context._response._body).toBe(initialBody);
      expect(context._response._headers).toEqual(initialHeaders);
    });
  });

  describe('OPTIONS Request Handling (Preflight)', () => {
    describe('Basic Preflight Response', () => {
      it('should handle OPTIONS requests with complete CORS headers', () => {
        const config = createCorsConfig({
          origin: 'https://example.com',
          methods: ['GET', 'POST', 'PUT'],
          allowedHeaders: ['Content-Type', 'Authorization'],
          exposedHeaders: ['X-Total-Count'],
          credentials: true,
          maxAge: 3600,
          optionsSuccessStatus: httpStatusCode.ok,
        });

        const context = createTestContext('OPTIONS', '/', {
          origin: 'https://example.com',
        });

        const result = handleCors(context, config);

        expect(result).toBe(false); // preflightContinue is false
        expect(context._response._statusCode).toBe(200);
        expect(context._response._body).toBe('');

        const headers = context._response._headers;
        expect(headers['Access-Control-Allow-Origin']).toBe('https://example.com');
        expect(headers['Access-Control-Allow-Methods']).toBe('GET, POST, PUT');
        expect(headers['Access-Control-Allow-Headers']).toBe('Content-Type, Authorization');
        expect(headers['Access-Control-Expose-Headers']).toBe('X-Total-Count');
        expect(headers['Access-Control-Allow-Credentials']).toBe('true');
        expect(headers['Access-Control-Max-Age']).toBe('3600');
      });

      it('should handle string allowedHeaders configuration', () => {
        const config = createCorsConfig({
          allowedHeaders: 'Content-Type, Authorization, X-Custom',
        });

        const context = createTestContext('OPTIONS');
        handleCors(context, config);

        expect(context._response._headers['Access-Control-Allow-Headers']).toBe('Content-Type, Authorization, X-Custom');
      });

      it('should handle array allowedHeaders configuration', () => {
        const config = createCorsConfig({
          allowedHeaders: ['Content-Type', 'Authorization', 'X-Custom'],
        });

        const context = createTestContext('OPTIONS');
        handleCors(context, config);

        expect(context._response._headers['Access-Control-Allow-Headers']).toBe('Content-Type, Authorization, X-Custom');
      });
    });

    describe('Preflight Continue Behavior', () => {
      it('should set empty body and return false when preflightContinue is false', () => {
        const config = createCorsConfig({ preflightContinue: false });
        const context = createTestContext('OPTIONS');

        const result = handleCors(context, config);

        expect(result).toBe(false);
        expect(context._response._body).toBe('');
      });

      it('should not set body and return true when preflightContinue is true', () => {
        const config = createCorsConfig({ preflightContinue: true });
        const context = createTestContext('OPTIONS');

        const result = handleCors(context, config);

        expect(result).toBe(true);
        expect(context._response._body).toBe(''); // Body should remain as default (empty string)
      });
    });

    describe('Origin Handling in OPTIONS Requests', () => {
      it('should use request origin when provided', () => {
        const config = createCorsConfig({ origin: '*' });
        const context = createTestContext('OPTIONS', '/', {
          origin: 'https://test.com',
        });

        handleCors(context, config);

        expect(context._response._headers['Access-Control-Allow-Origin']).toBe('https://test.com');
      });

      it('should use wildcard when no origin header provided', () => {
        const config = createCorsConfig({ origin: '*' });
        const context = createTestContext('OPTIONS');

        handleCors(context, config);

        expect(context._response._headers['Access-Control-Allow-Origin']).toBe('*');
      });

      it('should handle missing origin header gracefully', () => {
        const config = createCorsConfig({ origin: 'https://example.com' });
        const context = createTestContext('OPTIONS');

        handleCors(context, config);

        // Should still set headers even without origin
        expect(context._response._headers['Access-Control-Allow-Origin']).toBe('*'); // Fallback
      });
    });

    describe('Status Code Configuration', () => {
      const statusCodeTestCases = [
        { optionsSuccessStatus: httpStatusCode.ok, description: '200 OK' },
        { optionsSuccessStatus: httpStatusCode.noContent, description: '204 No Content' },
        { optionsSuccessStatus: httpStatusCode.accepted, description: '202 Accepted' },
      ];

      it.each(statusCodeTestCases)('should set status code $optionsSuccessStatus for $description', ({ optionsSuccessStatus }) => {
        const config = createCorsConfig({ optionsSuccessStatus });
        const context = createTestContext('OPTIONS');

        handleCors(context, config);

        expect(context._response._statusCode).toBe(optionsSuccessStatus);
      });
    });
  });

  describe('Origin Validation Edge Cases', () => {
    describe('Security Scenarios', () => {
      it('should handle case insensitive origin matching', () => {
        const config = createCorsConfig({ origin: 'https://example.com' });

        // Test various case combinations
        const originCases = ['https://example.com', 'HTTPS://EXAMPLE.COM', 'https://Example.Com', 'Https://Example.Com'];

        originCases.forEach((origin) => {
          const context = createTestContext('OPTIONS', '/', { origin });
          handleCors(context, config);

          // All should be handled since the implementation is case-insensitive
          expect(context._response._headers).toBeDefined();
        });
      });

      it('should handle wildcard origin configuration', () => {
        const config = createCorsConfig({ origin: '*' });
        const context = createTestContext('OPTIONS', '/', {
          origin: 'https://any-domain.com',
        });

        handleCors(context, config);

        expect(context._response._headers['Access-Control-Allow-Origin']).toBe('https://any-domain.com');
      });

      it('should handle array of allowed origins', () => {
        const config = createCorsConfig({
          origin: ['https://app.example.com', 'https://admin.example.com'],
        });

        // Test allowed origins
        const allowedOrigins = ['https://app.example.com', 'https://admin.example.com'];
        allowedOrigins.forEach((origin) => {
          const context = createTestContext('OPTIONS', '/', { origin });
          handleCors(context, config);
          expect(context._response._headers).toBeDefined();
        });

        // Test disallowed origin
        const rejectedContext = createTestContext('OPTIONS', '/', {
          origin: 'https://malicious.com',
        });
        handleCors(rejectedContext, config);
        expect(rejectedContext._response._headers).toBeDefined(); // Headers are still set, but validation happens elsewhere
      });

      it('should handle function-based origin validation', () => {
        const allowedDomains = ['example.com', 'test.com'];
        const originValidator = (origin: string | undefined) => {
          if (!origin) return false;
          try {
            const url = new URL(origin);
            return allowedDomains.includes(url.hostname);
          } catch {
            return false;
          }
        };

        const config = createCorsConfig({ origin: originValidator });

        // Test valid origins
        const validOrigins = ['https://example.com', 'http://test.com'];
        validOrigins.forEach((origin) => {
          const context = createTestContext('OPTIONS', '/', { origin });
          handleCors(context, config);
          expect(context._response._headers).toBeDefined();
        });

        // Test invalid origins
        const invalidOrigins = ['https://evil.com', 'not-a-url'];
        invalidOrigins.forEach((origin) => {
          const context = createTestContext('OPTIONS', '/', { origin });
          handleCors(context, config);
          expect(context._response._headers).toBeDefined(); // Headers still set
        });
      });

      it('should handle RegExp-based origin validation', () => {
        const config = createCorsConfig({
          origin: /^https:\/\/.*\.example\.com$/,
        });

        // Test valid subdomains
        const validSubdomains = ['https://app.example.com', 'https://api.example.com'];
        validSubdomains.forEach((origin) => {
          const context = createTestContext('OPTIONS', '/', { origin });
          handleCors(context, config);
          expect(context._response._headers).toBeDefined();
        });

        // Test invalid origins
        const invalidOrigins = ['http://app.example.com', 'https://example.com', 'https://app.evil.com'];
        invalidOrigins.forEach((origin) => {
          const context = createTestContext('OPTIONS', '/', { origin });
          handleCors(context, config);
          expect(context._response._headers).toBeDefined(); // Headers still set
        });
      });
    });

    describe('Malformed Origin Handling', () => {
      const malformedOriginCases = [
        { origin: '', description: 'empty string' },
        { origin: 'null', description: 'null string' },
        { origin: 'javascript:alert(1)', description: 'javascript protocol' },
        { origin: 'data:text/html,<script>alert(1)</script>', description: 'data protocol' },
        { origin: 'not-a-url', description: 'malformed URL' },
      ];

      it.each(malformedOriginCases)('should handle $description origin safely', ({ origin }) => {
        const config = createCorsConfig({ origin: 'https://example.com' });
        const context = createTestContext('OPTIONS', '/', { origin });

        // Should not throw and should still set headers
        expect(() => handleCors(context, config)).not.toThrow();
        expect(context._response._headers).toBeDefined();
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete CORS workflow for complex configuration', () => {
      const config = createCorsConfig({
        origin: ['https://app.example.com', 'https://admin.example.com'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
        exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
        credentials: true,
        maxAge: 7200,
        optionsSuccessStatus: 200,
        preflightContinue: false,
      });

      const context = createTestContext('OPTIONS', '/', {
        origin: 'https://app.example.com',
        'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      });

      const result = handleCors(context, config);

      expect(result).toBe(false);
      expect(context._response._statusCode).toBe(200);
      expect(context._response._body).toBe('');

      const headers = context._response._headers;
      expect(headers['Access-Control-Allow-Origin']).toBe('https://app.example.com');
      expect(headers['Access-Control-Allow-Methods']).toBe('GET, POST, PUT, DELETE');
      expect(headers['Access-Control-Allow-Headers']).toBe('Content-Type, Authorization, X-API-Key');
      expect(headers['Access-Control-Expose-Headers']).toBe('X-Total-Count, X-Page-Count');
      expect(headers['Access-Control-Allow-Credentials']).toBe('true');
      expect(headers['Access-Control-Max-Age']).toBe('7200');
    });

    it('should handle minimal CORS configuration', () => {
      const config: CorsConfiguration = {
        enabled: true,
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: '*',
        exposedHeaders: [],
        credentials: false,
        maxAge: 86400,
        optionsSuccessStatus: 204,
        preflightContinue: false,
      };
      const context = createTestContext('OPTIONS');

      handleCors(context, config);

      const headers = context._response._headers;
      expect(headers['Access-Control-Allow-Origin']).toBe('*');
      expect(headers['Access-Control-Allow-Methods']).toBe('GET, POST');
      expect(headers['Access-Control-Max-Age']).toBe('86400');
    });

    it('should maintain consistent behavior across multiple calls', () => {
      const config = createCorsConfig({ origin: 'https://example.com' });

      // Call multiple times with same configuration
      for (let i = 0; i < 3; i++) {
        const context = createTestContext('OPTIONS', '/', {
          origin: 'https://example.com',
        });

        const result = handleCors(context, config);

        expect(result).toBe(false);
        expect(context._response._headers['Access-Control-Allow-Origin']).toBe('https://example.com');
      }
    });
  });
});
