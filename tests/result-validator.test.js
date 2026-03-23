import { describe, it, expect } from 'vitest';
import { validateResult } from '../src/lib/result-validator.js';

describe('validateResult', () => {
  it('extracts JSON from markdown code fence', () => {
    const raw = 'Some text\n```json\n{"status": "ok"}\n```\nMore text';
    const result = validateResult(raw);
    expect(result.valid).toBe(true);
    expect(result.parsed).toEqual({ status: 'ok' });
  });

  it('extracts JSON from generic code fence', () => {
    const raw = '```\n{"value": 42}\n```';
    const result = validateResult(raw);
    expect(result.valid).toBe(true);
    expect(result.parsed).toEqual({ value: 42 });
  });

  it('extracts plain JSON object', () => {
    const raw = 'Result: {"answer": true}';
    const result = validateResult(raw);
    expect(result.valid).toBe(true);
    expect(result.parsed).toEqual({ answer: true });
  });

  it('returns error when no JSON found', () => {
    const result = validateResult('No JSON here at all');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('No JSON block found in output');
  });

  it('returns error for invalid JSON', () => {
    const raw = '```json\n{invalid json}\n```';
    const result = validateResult(raw);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/JSON parse error/);
  });

  it('validates required fields', () => {
    const raw = '{"name": "test"}';
    const config = { requiredFields: ['name', 'age'] };
    const result = validateResult(raw, config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: age');
  });

  it('warns on out-of-range field values', () => {
    const raw = '{"confidence": 150}';
    const config = { fieldRanges: { confidence: { min: 0, max: 100 } } };
    const result = validateResult(raw, config);
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
