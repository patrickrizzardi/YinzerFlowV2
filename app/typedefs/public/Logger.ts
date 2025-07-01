/**
 * Logger Interface for YinzerFlow
 *
 * Users can implement this interface to use their own logging system
 * (Winston, Pino, etc.) instead of the built-in YinzerFlow logger
 */
export interface Logger {
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  debug?(...args: unknown[]): void;
  trace?(...args: unknown[]): void;
}


