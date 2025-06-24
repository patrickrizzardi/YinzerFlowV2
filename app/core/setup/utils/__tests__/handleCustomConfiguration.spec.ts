import { describe, expect, it } from 'bun:test';
import { handleCustomConfiguration } from '@core/setup/utils/handleCustomConfiguration.ts';

describe('YinzerFlow', () => {
  it('should return a default configuration', () => {
    const config = handleCustomConfiguration({});
    expect(config).toBeDefined();
    expect(config.port).toBe(5000);
    expect(config.host).toBe('0.0.0.0');
    expect(config.rawBody).toBe(false);
    expect(config.networkLogs).toBe(false);
    expect(config.proxyHops).toBe(0);
  });

  it('should return a custom configuration with the default values', () => {
    const config = handleCustomConfiguration({
      port: 3000,
      rawBody: true,
    });

    expect(config.port).toBe(3000);
    expect(config.host).toBe('0.0.0.0');
    expect(config.rawBody).toBe(true);
    expect(config.networkLogs).toBe(false);
    expect(config.proxyHops).toBe(0);
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
});
