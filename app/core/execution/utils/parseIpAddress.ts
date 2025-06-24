import type { Setup } from '@core/setup/Setup.ts';
import type { THttpHeaders } from '@typedefs/constants/http.js';

/**
 * Parse the IP address from the headers
 *
 * @example
 * ```ts
 * parseIpAddress(new Setup({ proxyHops: 1 }), { 'x-forwarded-for': '127.0.0.1,192.168.1.1' });
 * // Returns '192.168.1.1'
 * ```
 */
export const parseIpAddress = (setup: Setup, headers: Partial<Record<THttpHeaders, string>>): string => {
  const { proxyHops } = setup.getConfiguration();
  if (!proxyHops || proxyHops === 0) return headers['x-forwarded-for'] ?? '';

  return headers['x-forwarded-for']?.split(',').at(-proxyHops) ?? '';
};
