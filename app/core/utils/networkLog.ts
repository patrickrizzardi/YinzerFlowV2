import dayjs from 'dayjs';
import type { InternalContextImpl } from '@typedefs/internal/InternalContextImpl.ts';

/**
 * YinzerFlow Network Logging System 🌐
 *
 * Separate network logging with Pittsburgh personality!
 * Boolean controlled, independent of main log levels.
 * Nginx-style access logs with performance tracking.
 */

// Shared constants for both logging systems
export const logPrefix = 'YINZER';

// Shared ANSI Color codes (reused from main log system)
export const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[96m', // Cyan for info
  yellow: '\x1b[93m', // Yellow for warn
  red: '\x1b[91m', // Red for error
  green: '\x1b[92m', // Green for success
  magenta: '\x1b[95m', // Magenta for performance
  gray: '\x1b[90m', // Gray for network logs
} as const;

const yinzerPhrases = {
  positive: ["n'at!", 'yinz are good!', "that's the way!", 'right on!', "lookin' good!", 'way to go!', 'keep it up!'],
  neutral: ["n'at", 'yinz know', "just sayin'", "that's how it is", 'what can ya do', 'it happens'],
  negative: ['aw jeez', "that ain't right", 'what a jagoff move', "that's terrible n'at", 'somebody messed up', 'this is bad news', 'yinz better fix this'],
} as const;

// Global network logging configuration
let networkLoggingEnabled = false;

// Helper functions (shared utilities)
export const formatTimestamp = (): string => dayjs().format('YYYY-MM-DD HH:mm:ss.SSS');

const getRandomPhrase = (type: 'negative' | 'neutral' | 'positive'): string => {
  const phrases = yinzerPhrases[type];
  return phrases[Math.floor(Math.random() * phrases.length)] ?? '';
};

/**
 * Calculate response size for logging
 */
const _calculateResponseSize = (responseBody: unknown): number => {
  if (typeof responseBody === 'string') {
    return Buffer.byteLength(responseBody, 'utf8');
  }
  if (Buffer.isBuffer(responseBody)) {
    return responseBody.length;
  }
  if (typeof responseBody === 'object' && responseBody !== null) {
    try {
      return Buffer.byteLength(JSON.stringify(responseBody), 'utf8');
    } catch {
      return 0;
    }
  }
  return 0;
};

/**
 * Get status emoji for response codes
 */
const _getStatusEmoji = (statusCode: number): string => {
  if (statusCode >= 200 && statusCode < 300) return '✅';
  if (statusCode >= 300 && statusCode < 400) return '🔄';
  if (statusCode >= 400 && statusCode < 500) return '❌';
  if (statusCode >= 500) return '💥';
  return '❓';
};

/**
 * Get performance details for response time with Pittsburgh personality
 */
const _getPerformanceDetails = (timeMs: number): { emoji: string; phrase: string } => {
  // < 50ms: Truly instant, users can't perceive any delay
  if (timeMs < 50) {
    return {
      emoji: '⚡',
      phrase: Math.random() < 0.5 ? "lightning quick n'at!" : 'faster than a Stillers touchdown!',
    };
  }
  // 50-100ms: Still feels instant for most interactions
  if (timeMs < 100) {
    return {
      emoji: '🔥',
      phrase: Math.random() < 0.5 ? "that's the way!" : "smooth as butter n'at!",
    };
  }
  // 100-200ms: Google's "good" threshold, still very responsive
  if (timeMs < 200) {
    return {
      emoji: '✅',
      phrase: Math.random() < 0.5 ? 'not bad yinz!' : "keepin' up just fine!",
    };
  }
  // 200-500ms: Noticeable but acceptable for complex operations
  if (timeMs < 500) {
    return {
      emoji: '⚠️',
      phrase: Math.random() < 0.5 ? 'eh, could be better' : "slowin' down a bit there",
    };
  }
  // 500ms-1s: Users start getting impatient
  if (timeMs < 1000) {
    return {
      emoji: '🐌',
      phrase: Math.random() < 0.5 ? "that's draggin' n'at" : "c'mon, pick up the pace!",
    };
  }
  // > 1s: Definitely problematic, needs attention
  return {
    emoji: '💥',
    phrase: Math.random() < 0.5 ? 'what a jagoff response time!' : 'slower than traffic on the Parkway!',
  };
};

// =============================================================================
// NETWORK LOGGING FUNCTIONS
// =============================================================================

const connection = (event: 'connect' | 'disconnect' | 'error', clientIp?: string, details?: string): void => {
  if (!networkLoggingEnabled) return;

  const timestamp = formatTimestamp();
  const ip = clientIp ?? 'unknown';
  const eventDetails = details ? ` - ${details}` : '';

  if (event === 'connect') {
    console.log(`${colors.gray}[${logPrefix}] 🤝 [${timestamp}] [NETWORK] New visitor from ${ip} - Welcome to the 'Burgh!${colors.reset}`);
  } else if (event === 'disconnect') {
    console.log(`${colors.gray}[${logPrefix}] 👋 [${timestamp}] [NETWORK] ${ip} headed out - Thanks for stopping by, yinz come back now!${colors.reset}`);
  } else {
    console.log(`${colors.red}[${logPrefix}] 💥 [${timestamp}] [NETWORK] Connection trouble with ${ip}${eventDetails} - That's not good, n'at!${colors.reset}`);
  }
};

const request = (context: InternalContextImpl, startTime: number, endTime: number): void => {
  if (!networkLoggingEnabled) return;

  const { request: req } = context;
  const response = context._response;
  const responseTimeMs = (endTime - startTime).toFixed(1);

  const clientIp = req.ipAddress || 'unknown';
  const { method, path, protocol } = req;
  const statusCode = response._statusCode;
  const responseSize = _calculateResponseSize(response._body);
  const referer = req.headers.referer ? `"${req.headers.referer}"` : '"-"';
  const userAgent = req.headers['user-agent'] ? `"${req.headers['user-agent']}"` : '"-"';
  const statusEmoji = _getStatusEmoji(statusCode);

  // Main nginx-style log with consistent formatting (using consistent timestamp)
  const logEntry = `🏠 ${clientIp} - - [${formatTimestamp()}] "${method} ${path} ${protocol}" ${statusCode} ${responseSize}b ${referer} ${userAgent} ${responseTimeMs}ms ${statusEmoji}`;
  console.log(`${colors.gray}[${logPrefix}] [${formatTimestamp()}] [NETWORK] ${logEntry}${colors.reset}`);

  // Performance log with Pittsburgh personality and consistent formatting
  const timeMs = parseFloat(responseTimeMs);
  const { emoji, phrase } = _getPerformanceDetails(timeMs);
  console.log(`${colors.magenta}[${logPrefix}] ${emoji} [${formatTimestamp()}] [PERF] Response time: ${responseTimeMs}ms - ${phrase}${colors.reset}`);
};

const serverStart = (port?: number, host?: string): void => {
  if (!networkLoggingEnabled) return;

  const timestamp = formatTimestamp();
  const address = port && host ? `${host}:${port}` : 'unknown';
  const phrase = getRandomPhrase('positive');
  console.log(
    `${colors.gray}[${logPrefix}] 🚀 [${timestamp}] [NETWORK] YinzerFlow server is up and running at ${address} - Ready to serve yinz all, ${phrase}!${colors.reset}`,
  );
};

const serverStop = (port?: number, host?: string): void => {
  if (!networkLoggingEnabled) return;

  const timestamp = formatTimestamp();
  const address = port && host ? `${host}:${port}` : 'unknown';
  const phrase = getRandomPhrase('neutral');
  console.log(
    `${colors.gray}[${logPrefix}] 🛑 [${timestamp}] [NETWORK] YinzerFlow server at ${address} is shutting down - See yinz later, ${phrase}!${colors.reset}`,
  );
};

const serverError = (port?: number, host?: string, details?: string): void => {
  if (!networkLoggingEnabled) return;

  const timestamp = formatTimestamp();
  const address = port && host ? `${host}:${port}` : 'unknown';
  const eventDetails = details ? ` - ${details}` : '';
  const phrase = getRandomPhrase('negative');
  console.log(
    `${colors.red}[${logPrefix}] 💥 [${timestamp}] [NETWORK] Server error at ${address}${eventDetails} - Something's not right, ${phrase}!${colors.reset}`,
  );
};

// =============================================================================
// CONFIGURATION & EXPORTS
// =============================================================================

/**
 * Enable or disable network logging (independent of main log level)
 */
const setEnabled = (enabled: boolean): void => {
  networkLoggingEnabled = enabled;
};

export const networkLog = {
  // Configuration
  setEnabled,

  // Network logging functions
  connection,
  request,
  serverStart,
  serverStop,
  serverError,
};
