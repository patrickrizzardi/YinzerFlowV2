import { createServer } from 'net';

import { RequestHandler } from '@core/execution/RequestHandlerImpl.ts';
import { ContextImpl } from '@core/execution/ContextImpl.ts';
import { SetupImpl } from '@core/setup/SetupImpl.ts';

export class YinzerFlow extends SetupImpl {
  private _isListening = false;
  private _server?: ReturnType<typeof createServer>;

  /**
   * Server Lifecycle
   */
  async listen(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create request handler once per listening session
      const requestHandler = new RequestHandler(this);

      this._server = createServer();

      /**
       * Setup event listeners
       */
      this._server.on('error', (error) => {
        console.error('An error occurred with yinzer flow. Please open an issue on github.', error);
        reject(error);
      });

      this._server.on('listening', () => {
        this._isListening = true;
        resolve();
      });

      this._server.on('connection', (socket) => {
        socket.on('data', (data) => {
          void (async (): Promise<void> => {
            try {
              // 1. Create context from raw request data
              const context = new ContextImpl(data, this);

              // 2. Handle the request pipeline
              await requestHandler.handle(context);

              // 3. Send response
              socket.write(context._response._parseResponseIntoString());
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

      this._server.listen(this._configuration.port, this._configuration.host);
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      if (this._server && this._isListening) {
        this._server.close(() => {
          this._isListening = false;
          resolve();
        });
      } else {
        this._isListening = false;
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
      isListening: this._isListening,
      port: this._configuration.port,
      host: this._configuration.host,
    };
  }
}
