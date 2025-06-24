import { describe, expect, it } from 'bun:test';
import { parseUrlEncodedForm } from '../parseUrlEncodedForm.ts';

describe('parseUrlEncodedForm', () => {
  describe('Basic parsing', () => {
    it('should parse simple key-value pairs', () => {
      const body = 'name=John&age=30&city=NewYork';
      const result = parseUrlEncodedForm(body);

      expect(result).toEqual({
        name: 'John',
        age: '30',
        city: 'NewYork',
      });
    });

    it('should handle empty values', () => {
      const body = 'empty=&hasvalue=test&alsoempty=';
      const result = parseUrlEncodedForm(body);

      expect(result).toEqual({
        empty: '',
        hasvalue: 'test',
        alsoempty: '',
      });
    });

    it('should handle keys without values', () => {
      const body = 'key1&key2=value2&key3';
      const result = parseUrlEncodedForm(body);

      expect(result).toEqual({
        key1: '',
        key2: 'value2',
        key3: '',
      });
    });
  });

  describe('URL encoding/decoding', () => {
    it('should decode URL-encoded characters', () => {
      const body = 'message=Hello%20World&email=test%40example.com&path=%2Fuser%2Fprofile';
      const result = parseUrlEncodedForm(body);

      expect(result).toEqual({
        message: 'Hello World',
        email: 'test@example.com',
        path: '/user/profile',
      });
    });

    it('should decode special characters', () => {
      const body = 'symbols=%21%40%23%24%25%5E%26%2A%28%29&plus=%2B&equals=%3D';
      const result = parseUrlEncodedForm(body);

      expect(result).toEqual({
        symbols: '!@#$%^&*()',
        plus: '+',
        equals: '=',
      });
    });

    it('should handle unicode characters', () => {
      const body = 'emoji=%F0%9F%8E%89&unicode=%E2%9C%85&chinese=%E4%B8%AD%E6%96%87';
      const result = parseUrlEncodedForm(body);

      expect(result).toEqual({
        emoji: '🎉',
        unicode: '✅',
        chinese: '中文',
      });
    });

    it('should handle already decoded characters', () => {
      const body = 'normal=text&already=decoded value';
      const result = parseUrlEncodedForm(body);

      expect(result).toEqual({
        normal: 'text',
        already: 'decoded value',
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      const body = '';
      const result = parseUrlEncodedForm(body);

      expect(result).toEqual({});
    });

    it('should handle string with only ampersands', () => {
      const body = '&&&';
      const result = parseUrlEncodedForm(body);

      expect(result).toEqual({});
    });

    it('should handle malformed pairs gracefully', () => {
      const body = 'valid=value&=emptykey&=&validagain=test';
      const result = parseUrlEncodedForm(body);

      expect(result).toEqual({
        valid: 'value',
        validagain: 'test',
      });
    });

    it('should handle duplicate keys (last one wins)', () => {
      const body = 'key=first&key=second&key=third';
      const result = parseUrlEncodedForm(body);

      expect(result).toEqual({
        key: 'third',
      });
    });

    it('should handle values with equals signs', () => {
      const body = 'equation=x%3D5%2B3&base64=dGVzdA%3D%3D';
      const result = parseUrlEncodedForm(body);

      expect(result).toEqual({
        equation: 'x=5+3',
        base64: 'dGVzdA==',
      });
    });

    it('should handle very long values', () => {
      const longValue = 'a'.repeat(1000);
      const encodedLongValue = encodeURIComponent(longValue);
      const body = `short=test&long=${encodedLongValue}&another=value`;
      const result = parseUrlEncodedForm(body);

      expect(result).toEqual({
        short: 'test',
        long: longValue,
        another: 'value',
      });
    });
  });

  describe('Error handling', () => {
    it('should handle malformed URL encoding gracefully', () => {
      const body = 'valid=test&malformed=%GG&another=value';
      const result = parseUrlEncodedForm(body);

      // Should not throw, but malformed encoding might not decode properly
      expect(result).toHaveProperty('valid', 'test');
      expect(result).toHaveProperty('another', 'value');
      expect(result).toHaveProperty('malformed');
    });

    it('should handle incomplete percent encoding', () => {
      const body = 'incomplete=%2&valid=test';
      const result = parseUrlEncodedForm(body);

      expect(result).toHaveProperty('valid', 'test');
      expect(result).toHaveProperty('incomplete');
    });
  });
});
