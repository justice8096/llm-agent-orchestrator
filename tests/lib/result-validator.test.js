import { describe, it, expect } from 'vitest';
import { validateResult } from '../../src/lib/result-validator.js';

describe('validateResult', () => {
  it('extracts JSON from ```json fences', () => {
    const rawOutput = 'Some text\n```json\n{"status": "success"}\n```\nMore text';
    const config = { requiredFields: ['status'] };
    
    const result = validateResult(rawOutput, config);
    
    expect(result.data).toEqual({ status: 'success' });
    expect(result.valid).toBe(true);
  });

  it('extracts JSON from plain text', () => {
    const rawOutput = '{"result": "done", "count": 5}';
    const config = { requiredFields: ['result'] };
    
    const result = validateResult(rawOutput, config);
    
    expect(result.data).toEqual({ result: 'done', count: 5 });
    expect(result.valid).toBe(true);
  });

  it('returns error when no JSON found', () => {
    const rawOutput = 'Just plain text with no JSON';
    const config = { requiredFields: [] };
    
    const result = validateResult(rawOutput, config);
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('JSON');
  });

  it('validates required fields from agentConfig', () => {
    const rawOutput = '{"status": "done"}';
    const config = { requiredFields: ['status', 'result'] };
    
    const result = validateResult(rawOutput, config);
    
    expect(result.valid).toBe(false);
    expect(result.missingFields).toContain('result');
  });

  it('reports field range warnings', () => {
    const rawOutput = '{"temperature": 2.5, "topP": -0.1}';
    const config = {
      requiredFields: [],
      fieldRanges: {
        temperature: { min: 0, max: 2 },
        topP: { min: 0, max: 1 },
      },
    };
    
    const result = validateResult(rawOutput, config);
    
    expect(result.warnings).toBeDefined();
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('returns valid:true for valid output', () => {
    const rawOutput = '{"status": "success", "message": "done"}';
    const config = { requiredFields: ['status', 'message'] };
    
    const result = validateResult(rawOutput, config);
    
    expect(result.valid).toBe(true);
    expect(result.data).toEqual({ status: 'success', message: 'done' });
  });

  it('handles nested JSON objects', () => {
    const rawOutput = '{"agent": {"id": "123", "name": "test"}, "status": "ok"}';
    const config = { requiredFields: ['status'] };
    
    const result = validateResult(rawOutput, config);
    
    expect(result.valid).toBe(true);
    expect(result.data.agent.id).toBe('123');
  });

  it('handles multiple JSON blocks and uses first valid one', () => {
    const rawOutput = 'Invalid json\n```json\n{"valid": true}\n```\nMore text';
    const config = { requiredFields: ['valid'] };
    
    const result = validateResult(rawOutput, config);
    
    expect(result.valid).toBe(true);
    expect(result.data.valid).toBe(true);
  });
});
