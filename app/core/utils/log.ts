import dayjs from 'dayjs';
import type { InternalContextImpl } from '@typedefs/internal/InternalContextImpl.ts';
import type { CreateEnum } from '@typedefs/internal/Generics.js';

/**
 * YinzerFlow Unified Logging System 🏗️
 *
 * Pittsburgh-style functional logging with yinzer personality!
 * Direct logging for maximum performance with consistent formatting and colors.
 */

const logPrefix = 'YINZER';

const logLevels = {
  info: 1,
  warn: 2,
  error: 3,
} as const;

type LogLevels = CreateEnum<typeof logLevels>;

// ANSI Color codes
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[96m', // Cyan for info
  orange: '\x1b[38;5;208m', // Fluorescent orange for warn
  red: '\x1b[91m', // Blood red for error
  green: '\x1b[92m', // Green for success
  yellow: '\x1b[93m', // Yellow for performance
  gray: '\x1b[90m', // Gray for network logs
} as const;

const yinzerPhrases = {
  positive: ["n'at!", 'yinz are good!', "that's the way!", 'right on!', "lookin' good!", 'way to go!', 'keep it up!'],
  neutral: ["n'at", 'yinz know', "just sayin'", "that's how it is", 'what can ya do', 'it happens'],
  negative: ['aw jeez', "that ain't right", 'what a jagoff move', "that's terrible n'at", 'somebody messed up', 'this is bad news', 'yinz better fix this'],
} as const;

let currentLogLevel: LogLevels = logLevels.info;

// Helper functions
const formatTimestamp = (): string => dayjs().format('YYYY-MM-DD HH:mm:ss.SSS');
const formatNetworkTimestamp = (): string => dayjs().format('DD/MMM/YYYY:HH:mm:ss ZZ');

const getRandomPhrase = (type: 'negative' | 'neutral' | 'positive'): string => {
  const phrases = yinzerPhrases[type];
  return phrases[Math.floor(Math.random() * phrases.length)] ?? '';
};

const shouldLog = (level: LogLevels): boolean => level >= currentLogLevel;

// Main logging functions - direct execution for maximum performance with consistent formatting
const info = (message: string, data?: unknown): void => {
  if (!shouldLog(logLevels.info)) return;
  const timestamp = formatTimestamp();
  const phrase = getRandomPhrase('positive');
  const dataText = data ? ` ${JSON.stringify(data, null, 0)}` : '';
  console.info(`${colors.cyan}[${logPrefix}] ✅ [${timestamp}] [INFO] ${message}${dataText} - ${phrase}${colors.reset}`);
};

const warn = (message: string, data?: unknown): void => {
  if (!shouldLog(logLevels.warn)) return;
  const timestamp = formatTimestamp();
  const phrase = getRandomPhrase('neutral');
  const dataText = data ? ` ${JSON.stringify(data, null, 0)}` : '';
  console.warn(`${colors.yellow}[${logPrefix}] ⚠️ [${timestamp}] [WARN] ${message}${dataText} - ${phrase}${colors.reset}`);
};

const error = (message: string, data?: unknown): void => {
  if (!shouldLog(logLevels.error)) return;
  const timestamp = formatTimestamp();
  const phrase = getRandomPhrase('negative');
  const dataText = data ? ` ${JSON.stringify(data, null, 0)}` : '';
  console.error(`${colors.red}[${logPrefix}] ❌ [${timestamp}] [ERROR] ${message}${dataText} - ${phrase}${colors.reset}`);
};

const success = (message: string, data?: unknown): void => {
  if (!shouldLog(logLevels.info)) return;
  const timestamp = formatTimestamp();
  const phrase = getRandomPhrase('positive');
  const dataText = data ? ` ${JSON.stringify(data, null, 0)}` : '';
  console.log(`${colors.green}[${logPrefix}] 🎉 [${timestamp}] [SUCCESS] ${message}${dataText} - ${phrase}${colors.reset}`);
};

const perf = (message: string, timeMs: number, data?: unknown): void => {
  if (!shouldLog(logLevels.info)) return;
  const timestamp = formatTimestamp();

  // Performance-based emojis and phrases
  let emoji = '❓';
  let phrase = '';

  // < 50ms: Truly instant, users can't perceive any delay
  if (timeMs < 50) {
    emoji = '⚡';
    phrase = Math.random() < 0.5 ? "lightning quick n'at!" : 'faster than a Stillers touchdown!';
    // 50-100ms: Still feels instant for most interactions
  } else if (timeMs < 100) {
    emoji = '🔥';
    phrase = Math.random() < 0.5 ? "that's the way!" : "smooth as butter n'at!";
    // 100-200ms: Google's "good" threshold, still very responsive
  } else if (timeMs < 200) {
    emoji = '✅';
    phrase = Math.random() < 0.5 ? 'not bad yinz!' : "keepin' up just fine!";
    // 200-500ms: Noticeable but acceptable for complex operations
  } else if (timeMs < 500) {
    emoji = '⚠️';
    phrase = Math.random() < 0.5 ? 'eh, could be better' : "slowin' down a bit there";
    // 500ms-1s: Users start getting impatient
  } else if (timeMs < 1000) {
    emoji = '🐌';
    phrase = Math.random() < 0.5 ? "that's draggin' n'at" : "c'mon, pick up the pace!";
    // > 1s: Definitely problematic, needs attention
  } else {
    emoji = '💥';
    phrase = Math.random() < 0.5 ? 'what a jagoff response time!' : 'slower than traffic on the Parkway!';
  }

  const perfData = data ? { ...data, executionTime: `${timeMs}ms` } : { executionTime: `${timeMs}ms` };
  const dataText = ` ${JSON.stringify(perfData, null, 0)}`;
  console.log(`${colors.orange}[${logPrefix}] ${emoji} [${timestamp}] [PERF] ${message}${dataText} - ${phrase}${colors.reset}`);
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
 * Get performance emoji and phrase for response time
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

/**
 * Log nginx-style access log entry
 */
const _logAccessEntry = (options: {
  clientIp: string;
  method: string;
  path: string;
  protocol: string;
  statusCode: number;
  responseSize: number;
  referer: string;
  userAgent: string;
  responseTimeMs: string;
  statusEmoji: string;
}): void => {
  const timestamp = formatTimestamp();
  const networkTimestamp = formatNetworkTimestamp();

  const { clientIp, method, path, protocol, statusCode, responseSize, referer, userAgent, responseTimeMs, statusEmoji } = options;

  const logEntry = `🏠 ${clientIp} - - [${networkTimestamp}] "${method} ${path} ${protocol}" ${statusCode} ${responseSize}b ${referer} ${userAgent} ${responseTimeMs}ms ${statusEmoji}`;
  console.log(`${colors.gray}[${logPrefix}] [${timestamp}] [NETWORK] ${logEntry}${colors.reset}`);
};

/**
 * Log performance entry with Pittsburgh personality
 */
const _logPerformanceEntry = (responseTimeMs: string): void => {
  const timestamp = formatTimestamp();
  const timeMs = parseFloat(responseTimeMs);
  const { emoji, phrase } = _getPerformanceDetails(timeMs);

  console.log(`${colors.orange}[${logPrefix}] ${emoji} [${timestamp}] [PERF] Response time: ${responseTimeMs}ms - ${phrase}${colors.reset}`);
};

// Network logging functions - direct execution for maximum performance with consistent formatting
const logRequest = (context: InternalContextImpl, startTime: number, endTime: number): void => {
  const { request } = context;
  const response = context._response;
  const responseTimeMs = (endTime - startTime).toFixed(1);

  const clientIp = request.ipAddress || 'unknown';
  const { method, path, protocol } = request;
  const statusCode = response._statusCode;

  // Calculate response size
  const responseSize = _calculateResponseSize(response._body);

  const referer = request.headers.referer ? `"${request.headers.referer}"` : '"-"';
  const userAgent = request.headers['user-agent'] ? `"${request.headers['user-agent']}"` : '"-"';
  const statusEmoji = _getStatusEmoji(statusCode);

  // Main nginx-style log with consistent formatting
  _logAccessEntry({
    clientIp,
    method,
    path,
    protocol,
    statusCode,
    responseSize,
    referer,
    userAgent,
    responseTimeMs,
    statusEmoji,
  });

  // Performance log with Pittsburgh personality and consistent formatting
  _logPerformanceEntry(responseTimeMs);
};

const logConnection = (event: 'connect' | 'disconnect' | 'error', clientIp?: string, details?: string): void => {
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

const logServerStart = (port?: number, host?: string): void => {
  const timestamp = formatTimestamp();
  const address = port && host ? `${host}:${port}` : 'unknown';
  const phrase = getRandomPhrase('positive');
  console.log(
    `${colors.gray}[${logPrefix}] 🚀 [${timestamp}] [NETWORK] YinzerFlow server is up and running at ${address} - Ready to serve yinz all, ${phrase}!${colors.reset}`,
  );
};

const logServerStop = (port?: number, host?: string): void => {
  const timestamp = formatTimestamp();
  const address = port && host ? `${host}:${port}` : 'unknown';
  const phrase = getRandomPhrase('neutral');
  console.log(
    `${colors.gray}[${logPrefix}] 🛑 [${timestamp}] [NETWORK] YinzerFlow server at ${address} is shutting down - See yinz later, ${phrase}!${colors.reset}`,
  );
};

const logServerError = (port?: number, host?: string, details?: string): void => {
  const timestamp = formatTimestamp();
  const address = port && host ? `${host}:${port}` : 'unknown';
  const eventDetails = details ? ` - ${details}` : '';
  const phrase = getRandomPhrase('negative');
  console.log(
    `${colors.red}[${logPrefix}] 💥 [${timestamp}] [NETWORK] Server error at ${address}${eventDetails} - Something's not right, ${phrase}!${colors.reset}`,
  );
};

// Configuration function
const setLogLevel = (level: LogLevels): void => {
  currentLogLevel = level;
};

// Export the unified logging API
export const log = {
  // Configuration
  setLogLevel,

  // Application logging
  info,
  warn,
  error,
  success,
  perf,

  // Network logging
  network: {
    request: logRequest,
    connection: logConnection,
    serverStart: logServerStart,
    serverStop: logServerStop,
    serverError: logServerError,
  },
};
