import { describe, expect, it } from 'bun:test';
import { parseIpAddress } from '../parseIpAddress.ts';
import { SetupImpl } from '@core/setup/Setup.ts';

describe('parseIpAddress', () => {
  describe('No proxy configuration', () => {
    it('should return x-forwarded-for header when proxyHops is 0', () => {
      const setup = new SetupImpl({ proxyHops: 0 });
      const headers = { 'x-forwarded-for': '192.168.1.100' };

      const result = parseIpAddress(setup, headers);

      expect(result).toBe('192.168.1.100');
    });

    it('should return x-forwarded-for header when proxyHops is undefined', () => {
      const setup = new SetupImpl({});
      const headers = { 'x-forwarded-for': '10.0.0.1' };

      const result = parseIpAddress(setup, headers);

      expect(result).toBe('10.0.0.1');
    });

    it('should return empty string when x-forwarded-for is missing', () => {
      const setup = new SetupImpl({ proxyHops: 0 });
      const headers = { host: 'example.com' };

      const result = parseIpAddress(setup, headers);

      expect(result).toBe('');
    });
  });

  describe('Single proxy hop', () => {
    it('should return last IP when proxyHops is 1', () => {
      const setup = new SetupImpl({ proxyHops: 1 });
      const headers = { 'x-forwarded-for': '203.0.113.1, 198.51.100.1, 192.168.1.100' };

      const result = parseIpAddress(setup, headers);

      expect(result).toBe('192.168.1.100');
    });

    it('should return only IP when single IP and proxyHops is 1', () => {
      const setup = new SetupImpl({ proxyHops: 1 });
      const headers = { 'x-forwarded-for': '192.168.1.100' };

      const result = parseIpAddress(setup, headers);

      expect(result).toBe('192.168.1.100');
    });

    it('should handle two IPs with proxyHops 1', () => {
      const setup = new SetupImpl({ proxyHops: 1 });
      const headers = { 'x-forwarded-for': '203.0.113.1, 192.168.1.100' };

      const result = parseIpAddress(setup, headers);

      expect(result).toBe('192.168.1.100');
    });
  });

  describe('Multiple proxy hops', () => {
    it('should return second-to-last IP when proxyHops is 2', () => {
      const setup = new SetupImpl({ proxyHops: 2 });
      const headers = { 'x-forwarded-for': '203.0.113.1, 198.51.100.1, 192.168.1.100' };

      const result = parseIpAddress(setup, headers);

      expect(result).toBe('198.51.100.1');
    });

    it('should return first IP when proxyHops is 3', () => {
      const setup = new SetupImpl({ proxyHops: 3 });
      const headers = { 'x-forwarded-for': '203.0.113.1, 198.51.100.1, 192.168.1.100' };

      const result = parseIpAddress(setup, headers);

      expect(result).toBe('203.0.113.1');
    });

    it('should handle proxyHops larger than available IPs', () => {
      const setup = new SetupImpl({ proxyHops: 5 });
      const headers = { 'x-forwarded-for': '203.0.113.1, 198.51.100.1' };

      const result = parseIpAddress(setup, headers);

      expect(result).toBe('');
    });
  });

  describe('IPv6 addresses', () => {
    it('should handle IPv6 addresses with proxyHops 1', () => {
      const setup = new SetupImpl({ proxyHops: 1 });
      const headers = { 'x-forwarded-for': '2001:db8::1, ::1' };

      const result = parseIpAddress(setup, headers);

      expect(result).toBe('::1');
    });

    it('should handle mixed IPv4 and IPv6 addresses', () => {
      const setup = new SetupImpl({ proxyHops: 2 });
      const headers = { 'x-forwarded-for': '192.168.1.1, 2001:db8::1, 10.0.0.1' };

      const result = parseIpAddress(setup, headers);

      expect(result).toBe('2001:db8::1');
    });
  });

  describe('Whitespace and formatting', () => {
    it('should handle spaces around commas', () => {
      const setup = new SetupImpl({ proxyHops: 2 });
      const headers = { 'x-forwarded-for': '203.0.113.1 , 198.51.100.1 , 192.168.1.100' };

      const result = parseIpAddress(setup, headers);

      expect(result).toBe('198.51.100.1');
    });

    it('should handle no spaces', () => {
      const setup = new SetupImpl({ proxyHops: 2 });
      const headers = { 'x-forwarded-for': '203.0.113.1,198.51.100.1,192.168.1.100' };

      const result = parseIpAddress(setup, headers);

      expect(result).toBe('198.51.100.1');
    });
  });

  describe('Edge cases', () => {
    it('should return empty string when x-forwarded-for is empty', () => {
      const setup = new SetupImpl({ proxyHops: 1 });
      const headers = { 'x-forwarded-for': '' };

      const result = parseIpAddress(setup, headers);

      expect(result).toBe('');
    });

    it('should handle multiple commas with empty values', () => {
      const setup = new SetupImpl({ proxyHops: 1 });
      const headers = { 'x-forwarded-for': ',,,' };

      const result = parseIpAddress(setup, headers);

      expect(result).toBe('');
    });

    it('should handle negative proxyHops', () => {
      const setup = new SetupImpl({ proxyHops: -1 });
      const headers = { 'x-forwarded-for': '203.0.113.1, 198.51.100.1' };

      const result = parseIpAddress(setup, headers);

      expect(result).toBe('');
    });
  });

  describe('Security considerations', () => {
    it('should handle potentially spoofed headers', () => {
      const setup = new SetupImpl({ proxyHops: 1 });
      const headers = { 'x-forwarded-for': '192.168.1.1, 203.0.113.1, 198.51.100.1' };

      const result = parseIpAddress(setup, headers);

      expect(result).toBe('198.51.100.1');
    });

    it('should handle very long IP chain', () => {
      const setup = new SetupImpl({ proxyHops: 2 });
      const longChain = Array.from({ length: 50 }, (_, i) => `192.168.1.${i + 1}`).join(', ');
      const headers = { 'x-forwarded-for': longChain };

      const result = parseIpAddress(setup, headers);

      expect(result).toBe('192.168.1.49');
    });

    it('should handle malformed IP addresses gracefully', () => {
      const setup = new SetupImpl({ proxyHops: 1 });
      const headers = { 'x-forwarded-for': 'not.an.ip, 192.168.1.1' };

      const result = parseIpAddress(setup, headers);

      expect(result).toBe('192.168.1.1');
    });
  });
});
