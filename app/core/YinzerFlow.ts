import { createServer } from 'net';
import type { IYinzerFlow } from '@typedefs/core/YinzerFlow.js';

import { Setup } from '@core/setup/Setup.ts';
import { ContextBuilder } from '@core/execution/ContextBuilder.ts';

export class YinzerFlow extends Setup implements IYinzerFlow {
  private isListening = false;
  private server?: ReturnType<typeof createServer>;

  /**
   * Server Lifecycle
   */
  async listen(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = createServer();

      /**
       * Setup event listeners
       */
      this.server.on('error', (error) => {
        console.error('An error occurred with yinzer flow. Please open an issue on github.', error);
        reject(error);
      });

      this.server.on('listening', () => {
        this.isListening = true;
        resolve();
      });

      this.server.on('connection', (socket) => {
        socket.on('data', (data) => {
          const context = new ContextBuilder(data, this);
          socket.write(context.getContext().rawResponse);
        });

        socket.on('error', (error) => {
          console.error('An error occurred with yinzer flow. Please open an issue on github.', error);
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
      port: this.getConfiguration().port,
      host: this.getConfiguration().host,
    };
  }
}
