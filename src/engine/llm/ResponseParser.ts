import { z } from "zod";

export class ParseError extends Error {
  rawResponse: string;
  partialResult?: any;

  constructor(message: string, rawResponse: string, partialResult?: any) {
    super(message);
    this.name = "ParseError";
    this.rawResponse = rawResponse;
    this.partialResult = partialResult;
  }
}

export class ResponseParser {
  /**
   * Parse a JSON response from an LLM with extensive error recovery.
   */
  static parseJson<T>(raw: string, schema?: z.ZodType<T>): T | any {
    if (!raw || !raw.trim()) {
      throw new ParseError("Empty response", raw);
    }

    // Strategy 1: Direct JSON parse (best case)
    let result = this.tryDirectParse(raw);
    if (result !== undefined) return this.validate(result, schema, raw);

    // Strategy 2: Extract from markdown code fences
    result = this.tryCodeFenceExtraction(raw);
    if (result !== undefined) return this.validate(result, schema, raw);

    // Strategy 3: Find JSON object/array boundaries
    result = this.tryBoundaryExtraction(raw);
    if (result !== undefined) return this.validate(result, schema, raw);

    // Strategy 4: Clean common JSON errors and retry
    result = this.tryCleanedParse(raw);
    if (result !== undefined) return this.validate(result, schema, raw);

    // Strategy 5: Attempt to repair truncated JSON
    result = this.tryTruncationRepair(raw);
    if (result !== undefined) {
      console.warn("Response was truncated — parsed partial result");
      return this.validate(result, schema, raw);
    }

    // All strategies failed
    throw new ParseError(
      `Could not parse JSON from response. First 200 chars: ${raw.substring(0, 200)}`,
      raw
    );
  }

  private static tryDirectParse(raw: string): any | undefined {
    try {
      return JSON.parse(raw.trim());
    } catch {
      return undefined;
    }
  }

  private static tryCodeFenceExtraction(raw: string): any | undefined {
    const patterns = [
      /```json\s*\n([\s\S]*?)\n\s*```/g,
      /```\s*\n([\s\S]*?)\n\s*```/g,
      /```json\s*([\s\S]*?)\s*```/g,
      /```([\s\S]*?)```/g,
    ];

    for (const pattern of patterns) {
      const matches = Array.from(raw.matchAll(pattern));
      for (const match of matches) {
        if (match[1]) {
          try {
            return JSON.parse(match[1].trim());
          } catch {
            continue;
          }
        }
      }
    }
    return undefined;
  }

  private static tryBoundaryExtraction(raw: string): any | undefined {
    // Find outermost { } or [ ]
    for (let i = 0; i < raw.length; i++) {
      const char = raw[i];
      if (char === '{' || char === '[') {
        const closingChar = char === '{' ? '}' : ']';
        let depth = 0;
        let inString = false;
        let escapeNext = false;

        for (let j = i; j < raw.length; j++) {
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          const c = raw[j];
          if (c === '\\' && inString) {
            escapeNext = true;
            continue;
          }
          if (c === '"' && !escapeNext) {
            inString = !inString;
          }
          if (!inString) {
            if (c === char) depth++;
            else if (c === closingChar) {
              depth--;
              if (depth === 0) {
                try {
                  return JSON.parse(raw.substring(i, j + 1));
                } catch {
                  break; // Try next if parsing fails
                }
              }
            }
          }
        }
      }
    }
    return undefined;
  }

  private static tryCleanedParse(raw: string): any | undefined {
    let cleaned = raw.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');
    // Remove trailing commas
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
    // Remove // comments
    cleaned = cleaned.replace(/\/\/[^\n]*\n/g, '\n');
    // Remove /* */ comments
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');

    const match = cleaned.search(/[{[]/);
    if (match !== -1) {
      cleaned = cleaned.substring(match);
      for (let i = cleaned.length - 1; i >= 0; i--) {
        if (cleaned[i] === '}' || cleaned[i] === ']') {
          cleaned = cleaned.substring(0, i + 1);
          break;
        }
      }
    }

    try {
      return JSON.parse(cleaned);
    } catch {
      return undefined;
    }
  }

  private static tryTruncationRepair(raw: string): any | undefined {
    let cleaned = raw.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/,\s*$/, '');

    let openBraces = (cleaned.match(/\{/g) || []).length - (cleaned.match(/\}/g) || []).length;
    let openBrackets = (cleaned.match(/\[/g) || []).length - (cleaned.match(/\]/g) || []).length;

    if (openBraces <= 0 && openBrackets <= 0) return undefined;

    let inString = false;
    for (let i = 0; i < cleaned.length; i++) {
      if (cleaned[i] === '"' && cleaned[i - 1] !== '\\') {
        inString = !inString;
      }
    }

    if (inString) {
      cleaned += '"';
    }

    // Remove trailing partial keys
    cleaned = cleaned.replace(/,\s*"[^"]*":\s*$/, '');
    cleaned = cleaned.replace(/,\s*"[^"]*":\s*"[^"]*$/, '');
    cleaned = cleaned.replace(/,\s*$/, '');

    let repaired = cleaned + ']'.repeat(Math.max(0, openBrackets)) + '}'.repeat(Math.max(0, openBraces));

    try {
      return JSON.parse(repaired);
    } catch {
      // More aggressive repair
      for (let attempt = 0; attempt < Math.min(openBraces + openBrackets, 10); attempt++) {
        let r = cleaned;
        r = r.replace(/,?\s*"[^"]*"\s*:\s*\{[^}]*$/, '');
        r = r.replace(/,?\s*"[^"]*"\s*:\s*\[[^\]]*$/, '');
        r = r.replace(/,?\s*$/, '');
        
        let rb = (r.match(/\{/g) || []).length - (r.match(/\}/g) || []).length;
        let rbr = (r.match(/\[/g) || []).length - (r.match(/\]/g) || []).length;
        r += ']'.repeat(Math.max(0, rbr)) + '}'.repeat(Math.max(0, rb));

        try {
          return JSON.parse(r);
        } catch {
          const lastComma = cleaned.lastIndexOf(',');
          if (lastComma > 0) {
            cleaned = cleaned.substring(0, lastComma);
          } else {
            break;
          }
        }
      }
    }
    return undefined;
  }

  private static validate<T>(result: any, schema: z.ZodType<T> | undefined, raw: string): T | any {
    if (!schema) return result;
    
    // Check if schema has safeParse method (Zod schema)
    if (typeof (schema as any).safeParse === 'function') {
      const parsed = (schema as z.ZodType<T>).safeParse(result);
      if (!parsed.success) {
        console.warn("Schema validation failed. Returning unvalidated result.", parsed.error.errors);
        return result;
      }
      return parsed.data;
    }
    
    // Plain object schema - just return result without validation
    return result;
  }
}
