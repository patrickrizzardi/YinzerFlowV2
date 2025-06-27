/**
 * YinzerFlow Logging Levels
 *
 * Hierarchical logging system where higher levels include lower level functionality:
 * - 'off': Silent mode - only shows slow request warnings (> 500ms)
 * - 'verbose': Application logging with Pittsburgh personality for all requests
 * - 'network': Network logging (nginx-style) + performance logs with Pittsburgh personality
 */
export const logLevels = {
  off: 'off',
  verbose: 'verbose',
  network: 'network',
} as const;
