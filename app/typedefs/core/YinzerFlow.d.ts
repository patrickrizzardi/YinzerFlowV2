import type { TBodyParser } from '@typedefs/configuration.ts';

export interface IYinzerFlow {
  /**
   * Server Lifecycle
   */
  listen: () => Promise<void>;
  close: () => Promise<void>;
  status: () => {
    isListening: boolean;
    port: number | undefined;
    host: string | undefined;
  };
}

export interface IConnectionOptions {
  /**
   * Default socket timeout in milliseconds (30 seconds)
   *
   * Standard timeout for most socket connections.
   * It is long enough for slow clients but short enough to prevent idle connections from staying open indefinitely.
   */
  socketTimeout: number;

  /**
   * Default graceful shutdown timeout in milliseconds (30 seconds)
   *
   * This is the maximum time to wait for a connection to complete before the server will close it.
   */
  gracefulShutdownTimeout: number;

  /**
   * Default keep-alive timeout in milliseconds (65 seconds)
   *
   * This is the maximum time a connection can be idle before the server will close it.
   * This is to allow for a connection to stay open for a period of time so subsequent requests can be handled without a new connection.
   * This is also to prevent a connection from staying open indefinitely.
   * This is also useful for load balancing and preventing a single server from being overwhelmed by a large number of connections.
   * AWS recommends a keep-alive timeout of 65 seconds because there idle timeout is 60 seconds.
   */
  keepAliveTimeout: number;

  /**
   * Default headers timeout in milliseconds (66 seconds)
   *
   * This is the maximum time to wait for a header from the client.
   * This is to allow for a connection to stay open for a period of time so subsequent requests can be handled without a new connection.
   * This is also to prevent a connection from staying open indefinitely.
   * This is also useful for load balancing and preventing a single server from being overwhelmed by a large number of connections.
   * It is recommended to set this value to be greater than the keep-alive timeout to prevent the server from closing the connection prematurely
   * before the keep-alive timeout has expired.
   */
  headersTimeout: number;
}

export interface IServerConfiguration {
  /**
   * Port number of the server
   * @default 3000
   */
  port?: number;

  /**
   * Host name of the server
   * @default '0.0.0.0'
   */
  readonly host?: string;

  //   corsOptions: CorsOptions;
  /**
   * Body parser type
   * @default 'json'
   * TODO: Create an override function that can be used in the before hook because
   * there are some instances where you need a raw request body.
   */
  bodyParser?: TBodyParser;

  /**
   * Verbose network logs
   * @default false
   */
  networkLogs?: boolean;

  /**
   * Number of proxy hops to the client
   * @default 0
   */
  proxyHops?: number;

  /**
   * Connection options
   * @default {
   *  keepAlive: true,
   *  keepAliveInitialDelay: 0,
   *  keepAliveDelay: 10000,
   *  keepAliveMaxDelay: 10000,
   *  keepAliveMaxDelay: 10000,
   */
  connectionOptions?: IConnectionOptions;

  /**
   * Compression level
   * TODO: Future feature
   */
  //   compression: boolean;

  /**
   * Cache
   * TODO: Future feature
   */
  //   cache: string;
}
