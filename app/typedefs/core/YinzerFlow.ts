import type { BodyParser } from 'typedefs/constants/configuration.ts';
import type { Context } from 'typedefs/core/Context.ts';

export interface YinzerFlowServer {
  configuration: ServerConfiguration;
  routes: string;
  hooks: string;
  handlers: string;
  context: Context;
  //   cache: string;
  //   session: string;
}

interface ServerConfiguration {
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

  //   corsOptions: CorsOptions;
  /**
   * Body parser type
   * @default 'json'
   * TODO: Create an override function that can be used in the before hook because
   * there are some instances where you need a raw request body.
   */
  bodyParser: BodyParser;

  /**
   * Verbose network logs
   * @default false
   */
  networkLogs: boolean;

  /**
   * Number of proxy hops to the client
   * @default 0
   */
  proxyHops: number;

  /**
   * Compression level
   * TODO: Future feature
   */
  //   compression: boolean;
}
