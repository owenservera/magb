import { describe, it, expect, beforeEach } from 'vitest';
import { ResponseParser } from './ResponseParser';

describe('ResponseParser', () => {
  describe('parseJson', () => {
    it('should parse valid JSON', () => {
      const json = '{"name": "test", "value": 42}';
      const result = ResponseParser.parseJson(json);
      expect(result).toEqual({ name: 'test', value: 42 });
    });

    it('should parse JSON with code blocks', () => {
      const json = '```json\n{"name": "test"}\n```';
      const result = ResponseParser.parseJson(json);
      expect(result).toEqual({ name: 'test' });
    });

    it('should parse JSON with markdown code blocks (no language)', () => {
      const json = '```\n{"name": "test"}\n```';
      const result = ResponseParser.parseJson(json);
      expect(result).toEqual({ name: 'test' });
    });

    it('should throw on invalid JSON', () => {
      const json = 'not valid json';
      expect(() => ResponseParser.parseJson(json)).toThrow('Could not parse JSON from response');
    });

    it('should handle plain object as schema (backward compatibility)', () => {
      const json = '{"name": "test", "value": 42}';
      // When schema is a plain object, it should just return the result without validation
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          value: { type: 'number' },
        },
        required: ['name', 'value'],
      };
      const result = ResponseParser.parseJson(json, schema);
      // Plain object schema doesn't have safeParse, so it returns unvalidated
      expect(result).toEqual({ name: 'test', value: 42 });
    });
  });
});
