import { bodyParser } from '@constants/configuration.ts';
import type { IServerConfiguration } from '@typedefs/core/YinzerFlow.js';

export const handleCustomConfiguration = (configuration?: IServerConfiguration): IServerConfiguration => {
  const defaultConfiguration: IServerConfiguration = {
    port: 5000,
    host: '0.0.0.0',
    bodyParser: bodyParser.json,
    networkLogs: false,
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
