
import { createServer } from 'net';
import type { Socket } from 'net';
import type { IServerConfiguration, IYinzerFlow } from 'typedefs/core/YinzerFlow.typedefs.ts';
import { handleCustomConfiguration } from 'core/handleCustomConfiguration.ts';
import type { IContext } from 'typedefs/core/Context.typedefs.ts';

import { Setup } from 'core/setup/Setup.ts';

export class YinzerFlow extends Setup implements IYinzerFlow {
  private isListening = false;
  private server?: ReturnType<typeof createServer>;
  private readonly configuration: IServerConfiguration;

  private readonly context: IContext = {
    request: {
      protocol: '',
      method: '',
      path: '',
      headers: {},
      body: undefined,
      query: undefined,
      params: undefined,
      ipAddress: '',
    },
    response: {
      statusCode: 200,
      status: 'OK',
      headers: {},
      body: undefined,
    },
  };

  constructor(configuration?: IServerConfiguration) {
    super();
    this.configuration = handleCustomConfiguration(configuration);
  }

  /**
   * Server Lifecycle
   */
  async listen(): Promise<void> {
    // TODO: Implement listen
    return new Promise((resolve, reject) => {
      this.server = createServer();

      /**
       * Setup event listeners
       */
      this.server.on('error', (error) => {
        reject(error);
      });

      this.server.on('listening', () => {
        this.isListening = true;
        resolve();
      });

      this.server.on('connection', (socket) => {
        socket.on('error', (error) => {
          reject(error);
        });
      });

      this.server.listen(this.configuration.port, this.configuration.host);
    });
  }

  async close(): Promise<void> {
    // TODO: Implement close
    return new Promise((resolve) => {
      if (this.server && this.isListening) {
        this.server.close(() => {
          this.isListening = false;
          resolve();
        });
      } else {
        this.isListening = false;
        resolve();
      }
    });
  }

  status(): {
    isListening: boolean;
    port: number | undefined;
    host: string | undefined;
  } {
    return {
      isListening: this.isListening,
      port: this.configuration.port,
      host: this.configuration.host,
    };
  }
}
