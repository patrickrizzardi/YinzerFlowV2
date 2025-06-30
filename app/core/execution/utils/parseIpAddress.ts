import type { InternalHttpHeaders } from '@typedefs/constants/http.js';
import type { InternalSetupImpl } from '@typedefs/internal/InternalSetupImpl.ts';

/**
 * Parse the IP address from the headers
 *
 * @example
 * ```ts
 * parseIpAddress(new Setup({ proxyHops: 1 }), { 'x-forwarded-for': '127.0.0.1,192.168.1.1' });
 * // Returns '192.168.1.1'
 * ```
 */
export const parseIpAddress = (setup: InternalSetupImpl, headers: Partial<Record<InternalHttpHeaders, string>>): string => {
  const { proxyHops } = setup._configuration;
  if (!proxyHops || proxyHops === 0) return headers['x-forwarded-for'] ?? '';

  if (proxyHops < 0) return '';

  return headers['x-forwarded-for']?.split(',').at(-proxyHops)?.trim() ?? '';
};
