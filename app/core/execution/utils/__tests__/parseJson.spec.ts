import { describe, expect, it } from 'bun:test';
import { parseApplicationJson } from '../parseJson.ts';

describe('parseApplicationJson', () => {
  describe('Valid JSON parsing', () => {
    it('should parse simple JSON objects', () => {
      const json = '{"name": "test", "value": 123}';
      const result = parseApplicationJson(json);

      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('should parse JSON arrays', () => {
      const json = '[1, 2, 3, "test"]';
      const result = parseApplicationJson(json);

      expect(result).toEqual([1, 2, 3, 'test'] as any);
    });

    it('should parse nested JSON objects', () => {
      const json = '{"user": {"name": "John", "age": 30}, "settings": {"theme": "dark"}}';
      const result = parseApplicationJson(json);

      expect(result).toEqual({
        user: { name: 'John', age: 30 },
        settings: { theme: 'dark' },
      });
    });

    it('should parse JSON with null values', () => {
      const json = '{"value": null, "exists": true}';
      const result = parseApplicationJson(json);

      expect(result).toEqual({ value: null, exists: true });
    });

    it('should parse JSON with boolean values', () => {
      const json = '{"isActive": true, "isDeleted": false}';
      const result = parseApplicationJson(json);

      expect(result).toEqual({ isActive: true, isDeleted: false });
    });

    it('should parse JSON with special characters', () => {
      const json = '{"message": "Hello\\nWorld", "emoji": "🎉", "unicode": "\\u0048\\u0065\\u006C\\u006C\\u006F"}';
      const result = parseApplicationJson(json);

      expect(result).toEqual({
        message: 'Hello\nWorld',
        emoji: '🎉',
        unicode: 'Hello',
      });
    });

    it('should parse empty JSON object', () => {
      const json = '{}';
      const result = parseApplicationJson(json);

      expect(result).toEqual({});
    });

    it('should parse empty JSON array', () => {
      const json = '[]';
      const result = parseApplicationJson(json);

      expect(result).toEqual([] as any);
    });
  });

  describe('Empty input handling', () => {
    it('should return undefined for empty string', () => {
      const result = parseApplicationJson('');
      expect(result).toBeUndefined();
    });

    it('should return undefined for whitespace-only string', () => {
      const result = parseApplicationJson('   \n\t  ');
      expect(result).toBeUndefined();
    });

    it('should return undefined for null string', () => {
      const result = parseApplicationJson('\0');
      expect(result).toBeUndefined();
    });
  });

  describe('Invalid JSON handling', () => {
    it('should throw error for malformed JSON object', () => {
      const json = '{"name": "test", "value":}';

      expect(() => parseApplicationJson(json)).toThrow('Invalid JSON');
    });

    it('should throw error for unquoted keys', () => {
      const json = '{name: "test"}';

      expect(() => parseApplicationJson(json)).toThrow('Invalid JSON');
    });

    it('should throw error for trailing commas', () => {
      const json = '{"name": "test", "value": 123,}';

      expect(() => parseApplicationJson(json)).toThrow('Invalid JSON');
    });

    it('should throw error for single quotes instead of double quotes', () => {
      const json = "{'name': 'test'}";

      expect(() => parseApplicationJson(json)).toThrow('Invalid JSON');
    });

    it('should throw error for incomplete JSON', () => {
      const json = '{"name": "test"';

      expect(() => parseApplicationJson(json)).toThrow('Invalid JSON');
    });

    it('should throw error for invalid characters', () => {
      const json = '{"name": "test", value: undefined}';

      expect(() => parseApplicationJson(json)).toThrow('Invalid JSON');
    });

    it('should include original error message in thrown error', () => {
      const json = '{"invalid": syntax}';

      try {
        parseApplicationJson(json);
        expect.unreachable('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Invalid JSON');
        // Different JS engines have different error messages, so just check for "Invalid JSON"
      }
    });
  });

  describe('Large JSON handling', () => {
    it('should handle large JSON objects', () => {
      const largeObject: Record<string, any> = {};
      for (let i = 0; i < 1000; i++) {
        largeObject[`key${i}`] = `value${i}`;
      }
      const json = JSON.stringify(largeObject);

      const result = parseApplicationJson(json);
      expect(result).toEqual(largeObject);
    });

    it('should handle large JSON arrays', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `item${i}` }));
      const json = JSON.stringify(largeArray);

      const result = parseApplicationJson(json);
      expect(result).toEqual(largeArray as any);
    });
  });

  describe('Edge cases', () => {
    it('should handle JSON with very deep nesting', () => {
      const deepObject = { level1: { level2: { level3: { level4: { value: 'deep' } } } } };
      const json = JSON.stringify(deepObject);

      const result = parseApplicationJson(json);
      expect(result).toEqual(deepObject);
    });

    it('should handle JSON with numeric keys', () => {
      const json = '{"0": "zero", "1": "one", "123": "one-two-three"}';
      const result = parseApplicationJson(json);

      expect(result).toEqual({ '0': 'zero', '1': 'one', '123': 'one-two-three' });
    });

    it('should handle JSON with escaped quotes', () => {
      const json = '{"message": "He said \\"Hello\\" to me"}';
      const result = parseApplicationJson(json);

      expect(result).toEqual({ message: 'He said "Hello" to me' });
    });

    it('should handle JSON numbers correctly', () => {
      const json = '{"int": 123, "float": 123.45, "negative": -456, "scientific": 1.23e10}';
      const result = parseApplicationJson(json);

      expect(result).toEqual({
        int: 123,
        float: 123.45,
        negative: -456,
        scientific: 1.23e10,
      });
    });
  });
});
