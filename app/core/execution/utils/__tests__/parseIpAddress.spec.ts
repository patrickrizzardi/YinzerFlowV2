import { describe, expect, it } from 'bun:test';
import { parseIpAddress } from '../parseIpAddress.ts';

// Mock setup object for testing
const createMockSetup = (proxyHops = 0) => ({
  getConfiguration: () => ({ proxyHops }),
});

describe('parseIpAddress', () => {
  describe('No proxy configuration', () => {
    it('should return x-forwarded-for header when proxyHops is 0', () => {
      const setup = createMockSetup(0);
      const headers = { 'x-forwarded-for': '192.168.1.100' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('192.168.1.100');
    });

    it('should return x-forwarded-for header when proxyHops is undefined', () => {
      const setup = createMockSetup(undefined as any);
      const headers = { 'x-forwarded-for': '10.0.0.1' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('10.0.0.1');
    });

    it('should return empty string when x-forwarded-for is missing and no proxy hops', () => {
      const setup = createMockSetup(0);
      const headers = { host: 'example.com' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('');
    });

    it('should return empty string when x-forwarded-for is undefined', () => {
      const setup = createMockSetup(0);
      const headers = { 'x-forwarded-for': undefined };

      const result = parseIpAddress(setup as any, headers as any);

      expect(result).toBe('');
    });
  });

  describe('Single proxy hop', () => {
    it('should return last IP when proxyHops is 1', () => {
      const setup = createMockSetup(1);
      const headers = { 'x-forwarded-for': '203.0.113.1, 198.51.100.1, 192.168.1.100' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('192.168.1.100');
    });

    it('should return only IP when single IP and proxyHops is 1', () => {
      const setup = createMockSetup(1);
      const headers = { 'x-forwarded-for': '192.168.1.100' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('192.168.1.100');
    });

    it('should handle two IPs with proxyHops 1', () => {
      const setup = createMockSetup(1);
      const headers = { 'x-forwarded-for': '203.0.113.1, 192.168.1.100' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('192.168.1.100');
    });
  });

  describe('Multiple proxy hops', () => {
    it('should return second-to-last IP when proxyHops is 2', () => {
      const setup = createMockSetup(2);
      const headers = { 'x-forwarded-for': '203.0.113.1, 198.51.100.1, 192.168.1.100' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('198.51.100.1');
    });

    it('should return first IP when proxyHops is 3', () => {
      const setup = createMockSetup(3);
      const headers = { 'x-forwarded-for': '203.0.113.1, 198.51.100.1, 192.168.1.100' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('203.0.113.1');
    });

    it('should handle proxyHops larger than available IPs', () => {
      const setup = createMockSetup(5);
      const headers = { 'x-forwarded-for': '203.0.113.1, 198.51.100.1' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('');
    });

    it('should handle complex proxy chain', () => {
      const setup = createMockSetup(4);
      const headers = { 'x-forwarded-for': '1.2.3.4, 5.6.7.8, 9.10.11.12, 13.14.15.16, 17.18.19.20' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('5.6.7.8');
    });
  });

  describe('IPv6 addresses', () => {
    it('should handle IPv6 addresses with proxyHops 1', () => {
      const setup = createMockSetup(1);
      const headers = { 'x-forwarded-for': '2001:db8::1, ::1' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('::1');
    });

    it('should handle mixed IPv4 and IPv6 addresses', () => {
      const setup = createMockSetup(2);
      const headers = { 'x-forwarded-for': '192.168.1.1, 2001:db8::1, 10.0.0.1' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('2001:db8::1');
    });

    it('should handle full IPv6 addresses', () => {
      const setup = createMockSetup(1);
      const headers = { 'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334, fe80::1' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('fe80::1');
    });
  });

  describe('Whitespace and formatting', () => {
    it('should handle spaces around commas', () => {
      const setup = createMockSetup(2);
      const headers = { 'x-forwarded-for': '203.0.113.1 , 198.51.100.1 , 192.168.1.100' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('198.51.100.1');
    });

    it('should handle extra spaces', () => {
      const setup = createMockSetup(1);
      const headers = { 'x-forwarded-for': '203.0.113.1  ,  198.51.100.1  ,  192.168.1.100' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('192.168.1.100');
    });

    it('should handle no spaces', () => {
      const setup = createMockSetup(2);
      const headers = { 'x-forwarded-for': '203.0.113.1,198.51.100.1,192.168.1.100' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('198.51.100.1');
    });
  });

  describe('Edge cases', () => {
    it('should return empty string when x-forwarded-for is empty', () => {
      const setup = createMockSetup(1);
      const headers = { 'x-forwarded-for': '' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('');
    });

    it('should handle single comma with no IPs', () => {
      const setup = createMockSetup(1);
      const headers = { 'x-forwarded-for': ',' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('');
    });

    it('should handle multiple commas with empty values', () => {
      const setup = createMockSetup(1);
      const headers = { 'x-forwarded-for': ',,,' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('');
    });

    it('should handle negative proxyHops', () => {
      const setup = createMockSetup(-1);
      const headers = { 'x-forwarded-for': '203.0.113.1, 198.51.100.1' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('');
    });

    it('should handle zero-length array access', () => {
      const setup = createMockSetup(1);
      const headers = { 'x-forwarded-for': '' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('');
    });
  });

  describe('Security considerations', () => {
    it('should handle potentially spoofed headers', () => {
      // Attacker trying to spoof IP by adding their own x-forwarded-for values
      const setup = createMockSetup(1);
      const headers = { 'x-forwarded-for': '192.168.1.1, 203.0.113.1, 198.51.100.1' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('198.51.100.1');
    });

    it('should handle very long IP chain', () => {
      const setup = createMockSetup(2);
      const longChain = Array.from({ length: 50 }, (_, i) => `192.168.1.${i + 1}`).join(', ');
      const headers = { 'x-forwarded-for': longChain };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('192.168.1.49');
    });

    it('should handle malformed IP addresses gracefully', () => {
      const setup = createMockSetup(1);
      const headers = { 'x-forwarded-for': 'not.an.ip, 192.168.1.1' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('192.168.1.1');
    });
  });

  describe('Type safety', () => {
    it('should handle headers object without x-forwarded-for', () => {
      const setup = createMockSetup(1);
      const headers = { 'content-type': 'application/json' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('');
    });

    it('should handle empty headers object', () => {
      const setup = createMockSetup(1);
      const headers = {};

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('');
    });

    it('should handle null configuration', () => {
      const setup = { getConfiguration: () => ({ proxyHops: null }) };
      const headers = { 'x-forwarded-for': '192.168.1.1' };

      const result = parseIpAddress(setup as any, headers);

      expect(result).toBe('192.168.1.1');
    });
  });
});
