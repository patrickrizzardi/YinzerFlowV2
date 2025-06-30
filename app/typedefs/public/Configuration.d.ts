import type { CreateEnum } from '@typedefs/internal/Generics.js';
import type { logLevels } from '@constants/log.ts';
import type { InternalHttpStatusCode } from '@typedefs/constants/http.js';

export interface ServerConfiguration {
  /**
   * Port number of the server
   * @default 3000
   */
  port: number;

  /**
   * Host name of the server
   * @default '0.0.0.0'
   */
  host: string;

  /**
   * CORS (Cross-Origin Resource Sharing) configuration
   * @default { enabled: true, origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], allowedHeaders: ['*'], credentials: false }
   */
  cors: CorsConfiguration;

  /**
   * Logging level for YinzerFlow server
   * - 'off': No logging (silent mode)
   * - 'verbose': Application logging with Pittsburgh personality (level 1)
   * - 'network': Network logging + application logging (level 2)
   * @default 'off'
   */
  logLevel: CreateEnum<typeof logLevels>;

  /**
   * Number of proxy hops to the client
   * @default 0
   * TODO: Future feature
   */
  proxyHops: number;

  /**
   * Connection options
   * @default {
   *  keepAlive: true,
   *  keepAliveInitialDelay: 0,
   *  keepAliveDelay: 10000,
   *  keepAliveMaxDelay: 10000,
   *  keepAliveMaxDelay: 10000,
   * TODO: Future feature
   */
  connectionOptions: ConnectionOptions;

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

/**
 * CORS Configuration Options
 * Provides fine-grained control over Cross-Origin Resource Sharing
 */
export type CorsConfiguration = CorsDisabledConfiguration | CorsEnabledConfiguration;

/**
 * CORS Disabled Configuration
 */
export interface CorsDisabledConfiguration {
  /**
   * Disable CORS handling
   */
  enabled: false;
}

/**
 * CORS Enabled Configuration
 * When CORS is enabled, origin is required
 */
export interface CorsEnabledConfiguration {
  /**
   * Enable CORS handling
   */
  enabled: true;

  /**
   * Allowed origins for CORS requests (REQUIRED when enabled)
   * - string: Single origin (e.g., 'https://example.com')
   * - string[]: Multiple specific origins
   * - '*': Allow all origins (not recommended for production with credentials)
   * - function: Dynamic origin validation
   */
  origin: Array<string> | RegExp | string | ((origin: string | undefined, request: any) => boolean);

  /**
   * HTTP methods allowed for CORS requests
   * @default ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
   */
  methods: Array<string>;

  /**
   * Headers allowed in CORS requests
   * - string[]: Specific headers
   * - '*': Allow all headers
   * @default ['*']
   */
  allowedHeaders: Array<string> | string | '*';

  /**
   * Headers exposed to the client in CORS responses
   * @default []
   */
  exposedHeaders: Array<string>;

  /**
   * Allow credentials (cookies, authorization headers) in CORS requests
   * Note: When true, origin cannot be '*'
   * @default false
   */
  credentials: boolean;

  /**
   * Maximum age (in seconds) for preflight cache
   * Tells browser how long to cache preflight response (client-side only)
   * @default 86400 (24 hours)
   */
  maxAge: number;

  /**
   * Continue to route handler after preflight
   * - false: Handle preflight completely in CORS system (recommended)
   * - true: Pass preflight to route handlers (requires manual OPTIONS routes)
   * @default false
   */
  preflightContinue: boolean;

  /**
   * Status code for successful OPTIONS requests
   * @default 204
   */
  optionsSuccessStatus: InternalHttpStatusCode;
}

export interface ConnectionOptions {
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
