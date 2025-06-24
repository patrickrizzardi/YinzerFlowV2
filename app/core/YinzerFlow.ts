import { createServer } from 'net';

import { Setup } from '@core/setup/Setup.ts';
import { RequestHandler } from '@core/execution/RequestHandler.ts';
import { ContextBuilder } from '@core/execution/ContextBuilder.ts';

export class YinzerFlow extends Setup {
  private isListening = false;
  private server?: ReturnType<typeof createServer>;

  /**
   * Server Lifecycle
   */
  async listen(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create request handler once per listening session
      const requestHandler = new RequestHandler(this);

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
          void (async (): Promise<void> => {
            try {
              // 1. Create context from raw request data
              const context = new ContextBuilder(data, this);

              // 2. Handle the request pipeline
              await requestHandler.handle(context);

              // 3. Send response
              socket.write(context.response.getRawResponse());
              socket.end();
            } catch (error) {
              console.error('Request handling failed. Please open an issue on github.', error);
              socket.destroy();
            }
          })().catch((error) => {
            // This satisfies the linter - we're explicitly handling the promise
            console.error('Unexpected error in request handler. Please open an issue on github.', error);
            socket.destroy();
          });
        });

        socket.on('error', (error) => {
          console.error('Socket error:', error);
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
