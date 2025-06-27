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
export const handleCustomConfiguration = (configuration?: ServerConfiguration): ServerConfiguration => {
  const defaultConfiguration: ServerConfiguration = {
    port: 5000,
    host: '0.0.0.0',
    logLevel: logLevels.off,
    proxyHops: 0,
    connectionOptions: {
      socketTimeout: 30000,
      gracefulShutdownTimeout: 30000,
      keepAliveTimeout: 65000,
      headersTimeout: 66000,
    },
  };

  Object.assign(defaultConfiguration, configuration);

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
