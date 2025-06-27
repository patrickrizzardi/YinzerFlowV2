import { describe, expect, it } from 'bun:test';
import { log } from '@core/utils/log.ts';

describe('Log Utility', () => {
  describe('Log Level Management', () => {
    it('should have a setLogLevel function', () => {
      expect(typeof log.setLogLevel).toBe('function');

      // Should not throw when setting valid log levels
      expect(() => log.setLogLevel(1)).not.toThrow();
      expect(() => log.setLogLevel(2)).not.toThrow();
      expect(() => log.setLogLevel(3)).not.toThrow();
    });
  });

  describe('Basic Logging Functions', () => {
    it('should have all required logging methods', () => {
      expect(typeof log.info).toBe('function');
      expect(typeof log.warn).toBe('function');
      expect(typeof log.error).toBe('function');
      expect(typeof log.success).toBe('function');
      expect(typeof log.perf).toBe('function');
    });

    it('should not throw when logging messages', () => {
      expect(() => log.info('Test message')).not.toThrow();
      expect(() => log.warn('Warning message')).not.toThrow();
      expect(() => log.error('Error message')).not.toThrow();
      expect(() => log.success('Success message')).not.toThrow();
      expect(() => log.perf('Performance message', 100)).not.toThrow();
    });

    it('should handle data objects without throwing', () => {
      const testData = { key: 'value', number: 42 };
      expect(() => log.info('Test with data', testData)).not.toThrow();
    });
  });

  describe('Network Logging', () => {
    it('should have network logging methods', () => {
      expect(typeof log.network).toBe('object');
      expect(typeof log.network.serverStart).toBe('function');
      expect(typeof log.network.serverStop).toBe('function');
      expect(typeof log.network.serverError).toBe('function');
      expect(typeof log.network.connection).toBe('function');
      expect(typeof log.network.request).toBe('function');
    });

    it('should not throw when logging network events', () => {
      expect(() => log.network.serverStart(3000, 'localhost')).not.toThrow();
      expect(() => log.network.serverStop(3000, 'localhost')).not.toThrow();
      expect(() => log.network.serverError(3000, 'localhost', 'Error message')).not.toThrow();
      expect(() => log.network.connection('connect', '192.168.1.1')).not.toThrow();
      expect(() => log.network.connection('disconnect', '192.168.1.1')).not.toThrow();
      expect(() => log.network.connection('error', '192.168.1.1', 'Connection failed')).not.toThrow();
    });

    it('should handle request logging without throwing', () => {
      // Mock a complete context object for testing
      const mockContext = {
        request: {
          method: 'GET',
          path: '/test',
          protocol: 'HTTP/1.1',
          ipAddress: '127.0.0.1',
          headers: {
            referer: 'http://example.com',
            'user-agent': 'test-agent/1.0',
          },
        },
        _response: {
          _statusCode: 200,
          _body: 'test response',
        },
      };

      expect(() => log.network.request(mockContext as any, Date.now() - 100, Date.now())).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined data gracefully', () => {
      expect(() => log.info('Test', null)).not.toThrow();
      expect(() => log.info('Test', undefined)).not.toThrow();
    });

    it('should handle circular references in data objects', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      expect(() => log.info('Test', circular)).not.toThrow();
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000);

      expect(() => log.info(longMessage)).not.toThrow();
    });

    it('should handle empty strings', () => {
      expect(() => log.info('')).not.toThrow();
      expect(() => log.warn('')).not.toThrow();
      expect(() => log.error('')).not.toThrow();
    });

    it('should handle special characters', () => {
      expect(() => log.info('Test with émojis 🎉 and spéciál chars')).not.toThrow();
    });
  });

  describe('Type Safety', () => {
    it('should accept string messages', () => {
      expect(() => log.info('string message')).not.toThrow();
    });

    it('should accept objects as data parameter', () => {
      expect(() => log.info('message', { data: 'value' })).not.toThrow();
    });

    it('should accept arrays as data parameter', () => {
      expect(() => log.info('message', [1, 2, 3])).not.toThrow();
    });

    it('should accept primitives as data parameter', () => {
      expect(() => log.info('message', 42)).not.toThrow();
      expect(() => log.info('message', true)).not.toThrow();
    });
  });
});
