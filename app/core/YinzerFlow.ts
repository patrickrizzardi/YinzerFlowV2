import { createServer } from 'net';
import type { Socket } from 'net';

import { RequestHandlerImpl } from '@core/execution/RequestHandlerImpl.ts';
import { ContextImpl } from '@core/execution/ContextImpl.ts';
import { SetupImpl } from '@core/setup/SetupImpl.ts';
import { log } from '@core/utils/log.ts';
import { logLevels } from '@constants/log.ts';
import type { ServerConfiguration } from '@typedefs/public/Configuration.js';

export class YinzerFlow extends SetupImpl {
  private _isListening = false;
  private _server?: ReturnType<typeof createServer>;

  constructor(configuration?: ServerConfiguration) {
    super(configuration);

    // Initialize logging
    if (this._configuration.logLevel === logLevels.verbose || this._configuration.logLevel === logLevels.network) {
      log.setLogLevel(1); // info level
      log.success('YinzerFlow initialized with logging enabled', { level: this._configuration.logLevel });
    }
    if (this._configuration.logLevel === logLevels.off) {
      log.setLogLevel(2); // Only show warnings and errors
    }
  }

  /**
   * Setup server with all event listeners
   */
  private _setupServer(resolve: () => void, reject: (error: Error) => void, requestHandler: RequestHandlerImpl): void {
    if (!this._server) return;

    this._server.on('error', (error: Error) => {
      if (this._configuration.logLevel !== logLevels.off) {
        log.network.serverError(this._configuration.port, this._configuration.host, error.message);
      }
      reject(error);
    });

    this._server.on('listening', () => {
      this._isListening = true;
      if (this._configuration.logLevel !== logLevels.off) {
        log.network.serverStart(this._configuration.port, this._configuration.host);
      }
      resolve();
    });

    this._server.on('connection', (socket) => {
      this._handleConnection(socket, requestHandler);
    });
  }

  /**
   * Process incoming request data
   */
  private async _processRequest({
    data,
    socket,
    requestHandler,
    clientAddress,
  }: {
    data: Buffer;
    socket: Socket;
    requestHandler: RequestHandlerImpl;
    clientAddress: string;
  }): Promise<void> {
    const startTime = Date.now();

    if (this._configuration.logLevel === logLevels.verbose) {
      log.info('Processing incoming request', { clientAddress, dataSize: data.length });
    }

    const context = new ContextImpl(data, this, clientAddress);

    await requestHandler.handle(context);

    socket.write(context._response._stringBody);
    socket.end();

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    // Log request
    if (this._configuration.logLevel === logLevels.network || this._configuration.logLevel === logLevels.verbose) {
      log.network.request(context, startTime, endTime);
    }
    if (this._configuration.logLevel === logLevels.off && processingTime > 500) {
      log.warn('Slow request detected', {
        method: context.request.method,
        path: context.request.path,
        statusCode: context._response._statusCode,
        responseTime: `${processingTime}ms`,
        clientAddress,
      });
    }
  }

  /**
   * Handle socket connection and all its events
   */
  private _handleConnection(socket: Socket, requestHandler: RequestHandlerImpl): void {
    const clientAddress = socket.remoteAddress ?? 'unknown';

    if (this._configuration.logLevel !== logLevels.off) {
      log.network.connection('connect', clientAddress);
    }

    socket.on('data', (data) => {
      this._processRequest({ data, socket, requestHandler, clientAddress }).catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (this._configuration.logLevel !== logLevels.off) {
          log.network.connection('error', clientAddress, `Unexpected error: ${errorMessage}`);
        }
        console.error('Unexpected error in request processing:', error);
        socket.destroy();
      });
    });

    socket.on('error', (error: Error) => {
      if (this._configuration.logLevel !== logLevels.off) {
        log.network.connection('error', clientAddress, error.message);
      }
      console.error('Socket error:', error);
    });

    socket.on('close', () => {
      if (this._configuration.logLevel !== logLevels.off) {
        log.network.connection('disconnect', clientAddress);
      }
    });
  }

  async listen(): Promise<void> {
    if (this._isListening) {
      throw new Error('Server is already listening');
    }

    return new Promise((resolve, reject) => {
      const requestHandler = new RequestHandlerImpl(this);
      this._server = createServer();

      this._setupServer(resolve, reject, requestHandler);
      this._server.listen(this._configuration.port, this._configuration.host);
    });
  }

  async close(): Promise<void> {
    if (!this._isListening || !this._server) {
      return;
    }

    return new Promise((resolve) => {
      if (!this._server) {
        this._isListening = false; // Probably redundant but just in case
        resolve();
        return;
      }

      this._server.close(() => {
        this._isListening = false;
        if (this._configuration.logLevel !== logLevels.off) {
          log.network.serverStop(this._configuration.port, this._configuration.host);
        }
        resolve();
      });
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
