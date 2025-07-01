import { afterEach, beforeEach, describe, expect, it, jest } from 'bun:test';
import { handleCustomConfiguration } from '@core/setup/utils/handleCustomConfiguration.ts';
import { logLevels } from '@constants/log.ts';

describe('handleCustomConfiguration', () => {
  // Mock console.warn to test security warnings since log.warn calls console.warn internally
  const mockConsoleWarn = jest.fn();
  const originalConsoleWarn = console.warn;

  const expectWarnCalledWithSubstring = (substring: string) => {
    const found = mockConsoleWarn.mock.calls.some((call) => call.some((arg) => typeof arg === 'string' && arg.includes(substring)));
    expect(found).toBe(true);
  };

  beforeEach(() => {
    console.warn = mockConsoleWarn;
    mockConsoleWarn.mockClear();
  });

  afterEach(() => {
    console.warn = originalConsoleWarn;
  });

  describe('Basic Configuration', () => {
    it('should return a default configuration', () => {
      const config = handleCustomConfiguration({});

      expect(config).toBeDefined();
      expect(config.port).toBe(5000);
      expect(config.host).toBe('0.0.0.0');
      expect(config.logLevel).toBe(logLevels.warn);
      expect(config.ipSecurity.trustedProxies).toEqual(['127.0.0.1', '::1']);
      expect(config.cors).toBeDefined();
      expect(config.cors.enabled).toBe(false);

      // Should have default body parser configuration
      expect(config.bodyParser).toBeDefined();
      expect(config.bodyParser.json.maxSize).toBe(262144); // 256KB
      expect(config.bodyParser.json.allowPrototypeProperties).toBe(false);
      expect(config.bodyParser.fileUploads.maxFileSize).toBe(10485760); // 10MB
      expect(config.bodyParser.urlEncoded.maxSize).toBe(1048576); // 1MB
    });

    it('should return a custom configuration with the default values', () => {
      const config = handleCustomConfiguration({
        port: 3000,
      });

      expect(config.port).toBe(3000);
      expect(config.host).toBe('0.0.0.0');
      expect(config.logLevel).toBe(logLevels.warn);
      expect(config.ipSecurity.trustedProxies).toEqual(['127.0.0.1', '::1']);
      expect(config.cors.enabled).toBe(false);
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

      if (config.cors.enabled) {
        expect(config.cors.enabled).toBe(true);
        expect(config.cors.origin).toBe('https://example.com');
        expect(config.cors.credentials).toBe(true);
        expect(config.cors.methods).toEqual(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']); // Should merge with defaults
      }
    });
  });

  describe('Body Parser Configuration Validation', () => {
    describe('JSON Parser Security Validation', () => {
      it('should validate minimum JSON maxSize', () => {
        expect(() =>
          handleCustomConfiguration({
            bodyParser: {
              json: { maxSize: 0 }, // Below 1 minimum
            },
          }),
        ).toThrow('bodyParser.json.maxSize must be at least 1 byte');
      });

      it('should validate minimum JSON maxDepth', () => {
        expect(() =>
          handleCustomConfiguration({
            bodyParser: {
              json: { maxDepth: 0 }, // Below 1 minimum
            },
          }),
        ).toThrow('bodyParser.json.maxDepth must be at least 1');
      });

      it('should validate minimum JSON maxKeys', () => {
        expect(() =>
          handleCustomConfiguration({
            bodyParser: {
              json: { maxKeys: 0 }, // Below 1 minimum
            },
          }),
        ).toThrow('bodyParser.json.maxKeys must be at least 1');
      });

      it('should validate minimum JSON maxStringLength', () => {
        expect(() =>
          handleCustomConfiguration({
            bodyParser: {
              json: { maxStringLength: 0 }, // Below 1 minimum
            },
          }),
        ).toThrow('bodyParser.json.maxStringLength must be at least 1 byte');
      });

      it('should validate minimum JSON maxArrayLength', () => {
        expect(() =>
          handleCustomConfiguration({
            bodyParser: {
              json: { maxArrayLength: 0 }, // Below 1 minimum
            },
          }),
        ).toThrow('bodyParser.json.maxArrayLength must be at least 1');
      });

      it('should accept valid JSON configuration', () => {
        const config = handleCustomConfiguration({
          bodyParser: {
            json: {
              maxSize: 2048,
              maxDepth: 15,
              maxKeys: 500,
              maxStringLength: 1000,
              maxArrayLength: 100,
              allowPrototypeProperties: false,
            },
          },
        });

        expect(config.bodyParser.json.maxSize).toBe(2048);
        expect(config.bodyParser.json.maxDepth).toBe(15);
        expect(config.bodyParser.json.allowPrototypeProperties).toBe(false);
      });
    });

    describe('File Upload Security Validation', () => {
      it('should validate minimum file maxFileSize', () => {
        expect(() =>
          handleCustomConfiguration({
            bodyParser: {
              fileUploads: { maxFileSize: 0 }, // Below 1 minimum
            },
          }),
        ).toThrow('bodyParser.fileUploads.maxFileSize must be at least 1 byte');
      });

      it('should validate minimum file maxTotalSize', () => {
        expect(() =>
          handleCustomConfiguration({
            bodyParser: {
              fileUploads: { maxTotalSize: 0 }, // Below 1 minimum
            },
          }),
        ).toThrow('bodyParser.fileUploads.maxTotalSize must be at least 1 byte');
      });

      it('should validate minimum maxFiles', () => {
        expect(() =>
          handleCustomConfiguration({
            bodyParser: {
              fileUploads: { maxFiles: 0 }, // Below 1 minimum
            },
          }),
        ).toThrow('bodyParser.fileUploads.maxFiles must be at least 1');
      });

      it('should validate minimum maxFilenameLength', () => {
        expect(() =>
          handleCustomConfiguration({
            bodyParser: {
              fileUploads: { maxFilenameLength: 0 }, // Below 1 minimum
            },
          }),
        ).toThrow('bodyParser.fileUploads.maxFilenameLength must be at least 1 character');
      });

      it('should accept valid file upload configuration', () => {
        const config = handleCustomConfiguration({
          bodyParser: {
            fileUploads: {
              maxFileSize: 5242880, // 5MB
              maxTotalSize: 26214400, // 25MB
              maxFiles: 5,
              maxFilenameLength: 100,
              allowedExtensions: ['.jpg', '.png', '.pdf'],
              blockedExtensions: ['.exe', '.bat'],
            },
          },
        });

        expect(config.bodyParser.fileUploads.maxFileSize).toBe(5242880);
        expect(config.bodyParser.fileUploads.maxTotalSize).toBe(26214400);
        expect(config.bodyParser.fileUploads.maxFiles).toBe(5);
        expect(config.bodyParser.fileUploads.allowedExtensions).toEqual(['.jpg', '.png', '.pdf']);
        expect(config.bodyParser.fileUploads.blockedExtensions).toEqual(['.exe', '.bat']);
      });
    });

    describe('URL-Encoded Form Security Validation', () => {
      it('should validate minimum URL-encoded maxSize', () => {
        expect(() =>
          handleCustomConfiguration({
            bodyParser: {
              urlEncoded: { maxSize: 0 }, // Below 1 minimum
            },
          }),
        ).toThrow('bodyParser.urlEncoded.maxSize must be at least 1 byte');
      });

      it('should validate minimum maxFields', () => {
        expect(() =>
          handleCustomConfiguration({
            bodyParser: {
              urlEncoded: { maxFields: 0 }, // Below 1 minimum
            },
          }),
        ).toThrow('bodyParser.urlEncoded.maxFields must be at least 1');
      });

      it('should validate minimum maxFieldNameLength', () => {
        expect(() =>
          handleCustomConfiguration({
            bodyParser: {
              urlEncoded: { maxFieldNameLength: 0 }, // Below 1 minimum
            },
          }),
        ).toThrow('bodyParser.urlEncoded.maxFieldNameLength must be at least 1 character');
      });

      it('should validate minimum maxFieldLength', () => {
        expect(() =>
          handleCustomConfiguration({
            bodyParser: {
              urlEncoded: { maxFieldLength: 0 }, // Below 1 minimum
            },
          }),
        ).toThrow('bodyParser.urlEncoded.maxFieldLength must be at least 1 byte');
      });

      it('should accept valid URL-encoded configuration', () => {
        const config = handleCustomConfiguration({
          bodyParser: {
            urlEncoded: {
              maxSize: 2097152, // 2MB
              maxFields: 500,
              maxFieldNameLength: 50,
              maxFieldLength: 524288, // 512KB
            },
          },
        });

        expect(config.bodyParser.urlEncoded.maxSize).toBe(2097152);
        expect(config.bodyParser.urlEncoded.maxFields).toBe(500);
      });
    });
  });

  describe('Security Warnings', () => {
    describe('JSON Security Warnings', () => {
      it('should warn about prototype pollution being enabled', () => {
        handleCustomConfiguration({
          bodyParser: {
            json: { allowPrototypeProperties: true },
          },
        });

        expectWarnCalledWithSubstring('[SECURITY WARNING] bodyParser.json.allowPrototypeProperties is enabled');
      });

      it('should warn about very large JSON sizes', () => {
        const largeSize = 20 * 1024 * 1024; // 20MB
        handleCustomConfiguration({
          bodyParser: {
            json: { maxSize: largeSize },
          },
        });

        expectWarnCalledWithSubstring('[SECURITY WARNING] bodyParser.json.maxSize is set to');
        expectWarnCalledWithSubstring('Large JSON payloads can cause memory exhaustion');
      });

      it('should warn about very deep nesting', () => {
        handleCustomConfiguration({
          bodyParser: {
            json: { maxDepth: 100 },
          },
        });

        expectWarnCalledWithSubstring('[SECURITY WARNING] bodyParser.json.maxDepth is set to 100');
        expectWarnCalledWithSubstring('Very deep JSON nesting can cause stack overflow attacks');
      });
    });

    describe('File Upload Security Warnings', () => {
      it('should warn about very large file uploads', () => {
        const largeFileSize = 200 * 1024 * 1024; // 200MB
        handleCustomConfiguration({
          bodyParser: {
            fileUploads: { maxFileSize: largeFileSize },
          },
        });

        expectWarnCalledWithSubstring('[SECURITY WARNING] bodyParser.fileUploads.maxFileSize is set to');
        expectWarnCalledWithSubstring('Large file uploads can consume significant server resources');
      });

      it('should warn about very large total upload sizes', () => {
        const largeTotalSize = 2 * 1024 * 1024 * 1024; // 2GB
        handleCustomConfiguration({
          bodyParser: {
            fileUploads: { maxTotalSize: largeTotalSize },
          },
        });

        expectWarnCalledWithSubstring('[SECURITY WARNING] bodyParser.fileUploads.maxTotalSize is set to');
        expectWarnCalledWithSubstring('Very large total upload sizes can cause memory and disk space exhaustion');
      });

      it('should warn about dangerous file extensions in allowedExtensions', () => {
        handleCustomConfiguration({
          bodyParser: {
            fileUploads: {
              allowedExtensions: ['.jpg', '.exe', '.bat'],
            },
          },
        });

        expectWarnCalledWithSubstring('[SECURITY WARNING] bodyParser.fileUploads.allowedExtensions includes dangerous file types: .exe, .bat');
        expectWarnCalledWithSubstring('This could allow execution of malicious files');
      });

      it('should warn about no file extension restrictions', () => {
        handleCustomConfiguration({
          bodyParser: {
            fileUploads: {
              allowedExtensions: [],
              blockedExtensions: [],
            },
          },
        });

        expectWarnCalledWithSubstring('[SECURITY WARNING] File uploads have no extension restrictions');
        expectWarnCalledWithSubstring('Consider adding blockedExtensions or allowedExtensions');
      });
    });
  });

  describe('Configuration Merging', () => {
    it('should merge partial JSON configuration with defaults', () => {
      const config = handleCustomConfiguration({
        bodyParser: {
          json: {
            maxSize: 512000, // Only override this
            // Other fields should use defaults
          },
        },
      });

      expect(config.bodyParser.json.maxSize).toBe(512000); // Overridden
      expect(config.bodyParser.json.maxDepth).toBe(10); // Default
      expect(config.bodyParser.json.allowPrototypeProperties).toBe(false); // Default
    });

    it('should merge partial file upload configuration with defaults', () => {
      const config = handleCustomConfiguration({
        bodyParser: {
          fileUploads: {
            maxFiles: 20, // Only override this
            allowedExtensions: ['.pdf'],
            // Other fields should use defaults
          },
        },
      });

      expect(config.bodyParser.fileUploads.maxFiles).toBe(20); // Overridden
      expect(config.bodyParser.fileUploads.allowedExtensions).toEqual(['.pdf']); // Overridden
      expect(config.bodyParser.fileUploads.maxFileSize).toBe(10485760); // Default
    });

    it('should merge partial URL-encoded configuration with defaults', () => {
      const config = handleCustomConfiguration({
        bodyParser: {
          urlEncoded: {
            maxFields: 2000, // Only override this
            // Other fields should use defaults
          },
        },
      });

      expect(config.bodyParser.urlEncoded.maxFields).toBe(2000); // Overridden
      expect(config.bodyParser.urlEncoded.maxSize).toBe(1048576); // Default
      expect(config.bodyParser.urlEncoded.maxFieldLength).toBe(1048576); // Default
    });
  });

  describe('Complete Body Parser Configuration', () => {
    it('should handle complete custom body parser configuration', () => {
      const customConfig = {
        bodyParser: {
          json: {
            maxSize: 2097152, // 2MB
            maxDepth: 20,
            allowPrototypeProperties: true,
            maxKeys: 2000,
            maxStringLength: 50000,
            maxArrayLength: 5000,
          },
          fileUploads: {
            maxFileSize: 52428800, // 50MB
            maxTotalSize: 104857600, // 100MB
            maxFiles: 20,
            allowedExtensions: ['.jpg', '.png', '.pdf'],
            blockedExtensions: ['.exe', '.bat', '.cmd', '.scr'],
            maxFilenameLength: 512,
          },
          urlEncoded: {
            maxSize: 5242880, // 5MB
            maxFields: 5000,
            maxFieldNameLength: 200,
            maxFieldLength: 2097152, // 2MB
          },
        },
      };

      const config = handleCustomConfiguration(customConfig);

      // Verify all custom values are applied
      expect(config.bodyParser.json.maxSize).toBe(2097152);
      expect(config.bodyParser.json.allowPrototypeProperties).toBe(true);
      expect(config.bodyParser.fileUploads.maxFiles).toBe(20);
      expect(config.bodyParser.fileUploads.allowedExtensions).toEqual(['.jpg', '.png', '.pdf']);
      expect(config.bodyParser.urlEncoded.maxFields).toBe(5000);

      // Should trigger security warnings for prototype pollution
      expectWarnCalledWithSubstring('allowPrototypeProperties is enabled');
    });
  });
});
