import { describe, expect, it } from 'bun:test';
import { handleCustomConfiguration } from '@core/setup/utils/handleCustomConfiguration.ts';
import { logLevels } from '@constants/log.ts';

describe('YinzerFlow', () => {
  it('should return a default configuration', () => {
    const config = handleCustomConfiguration({});
    expect(config).toBeDefined();
    expect(config.port).toBe(5000);
    expect(config.host).toBe('0.0.0.0');
    expect(config.logLevel).toBe(logLevels.off);
    expect(config.proxyHops).toBe(0);
    expect(config.cors).toBeDefined();
    expect(config.cors?.enabled).toBe(false);
    // When CORS is disabled, only 'enabled' property is available
  });

  it('should return a custom configuration with the default values', () => {
    const config = handleCustomConfiguration({
      port: 3000,
    });

    expect(config.port).toBe(3000);
    expect(config.host).toBe('0.0.0.0');
    expect(config.logLevel).toBe(logLevels.off);
    expect(config.proxyHops).toBe(0);
    expect(config.cors?.enabled).toBe(false);
  });

  it('should normalize the port number if it is a string', () => {
    const config = handleCustomConfiguration({ port: '5000' as unknown as number });
    expect(config.port).toBe(5000);
  });

  it('should throw an error if the port is greater than 65535', () => {
    expect(() => handleCustomConfiguration({ port: 65536 })).toThrow('Invalid port number');
  });

  it('should throw an error if the port is less than 1', () => {
    expect(() => handleCustomConfiguration({ port: 0 })).toThrow('Invalid port number');
  });

  it('should handle custom CORS configuration', () => {
    const config = handleCustomConfiguration({
      cors: {
        enabled: true,
        origin: 'https://example.com',
        credentials: true,
      },
    });

    expect(config.cors?.enabled).toBe(true);
    expect(config.cors?.origin).toBe('https://example.com');
    expect(config.cors?.credentials).toBe(true);
    expect(config.cors?.methods).toEqual(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']); // Should merge with defaults
  });
});
