import type { ServerConfiguration } from '@typedefs/public/Configuration.js';
import { logLevels } from '@constants/log.ts';

/**
 * Handle custom configuration
 *
 * @example
 * ```ts
 * handleCustomConfiguration({ port: 3000 });
 * // Returns { port: 3000, host: '0.0.0.0', logLevel: 'off', proxyHops: 0, connectionOptions: { socketTimeout: 30000, gracefulShutdownTimeout: 30000, keepAliveTimeout: 65000, headersTimeout: 66000 } }
 * ```
 */
export const handleCustomConfiguration = (configuration?: Partial<ServerConfiguration>): ServerConfiguration => {
  // Default CORS configuration for when CORS is enabled
  const defaultCorsEnabledConfig = {
    enabled: true,
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: '*',
    exposedHeaders: [],
    credentials: false,
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };

  const defaultConfiguration: ServerConfiguration = {
    port: 5000,
    host: '0.0.0.0',
    logLevel: logLevels.off,
    proxyHops: 0,
    cors: {
      enabled: false, // Disabled by default
    },
    connectionOptions: {
      socketTimeout: 30000,
      gracefulShutdownTimeout: 30000,
      keepAliveTimeout: 65000,
      headersTimeout: 66000,
    },
  };

  // Merge configuration with proper handling of nested objects
  Object.assign(defaultConfiguration, configuration);

  // Handle CORS configuration merging if the user has enabled it
  if (configuration?.cors?.enabled) {
    // When CORS is enabled, merge with enabled defaults
    defaultConfiguration.cors = {
      ...defaultCorsEnabledConfig,
      ...configuration.cors,
    };
  }

  /**
   * Normalize the port number
   * We strictly check for undefined because we want inform the user that 0 is not a valid port number
   */
  if (configuration?.port !== undefined) {
    const normalizedPort = Number(configuration.port);
    if (isNaN(normalizedPort) || normalizedPort < 1 || normalizedPort > 65535) {
      throw new Error('Invalid port number');
    }
    defaultConfiguration.port = normalizedPort;
  }

  return defaultConfiguration;
};
