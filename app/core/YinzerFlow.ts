import { createServer } from 'net';
import type { IYinzerFlow } from '@typedefs/core/YinzerFlow.js';

import type { IContext } from '@typedefs/core/Context.js';

import { Setup } from '@core/setup/Setup.ts';

export class YinzerFlow extends Setup implements IYinzerFlow {
  private isListening = false;
  private server?: ReturnType<typeof createServer>;

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

      this.server.listen(this.getConfiguration().port, this.getConfiguration().host);
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
