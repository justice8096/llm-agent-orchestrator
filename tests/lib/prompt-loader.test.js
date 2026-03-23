import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadPrompt } from '../../src/lib/prompt-loader.js';

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}));

import { readFileSync } from 'fs';

describe('loadPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('loads file and returns content', () => {
    readFileSync.mockReturnValue('This is the prompt content');
    
    const result = loadPrompt('/path/to/prompt.txt', {});
    
    expect(readFileSync).toHaveBeenCalledWith('/path/to/prompt.txt', 'utf-8');
    expect(result).toBe('This is the prompt content');
  });

  it('replaces {{VARIABLE}} placeholders with context values', () => {
    readFileSync.mockReturnValue('Agent ID: {{AGENT_ID}}, Date: {{RUN_DATE}}');
    
    const result = loadPrompt('/path/to/prompt.txt', {
      AGENT_ID: 'agent-123',
      RUN_DATE: '2026-03-23',
    });
    
    expect(result).toBe('Agent ID: agent-123, Date: 2026-03-23');
  });

  it('returns [NOT PROVIDED] for missing variables', () => {
    readFileSync.mockReturnValue('Agent: {{AGENT_ID}}, Unknown: {{UNKNOWN_VAR}}');
    
    const result = loadPrompt('/path/to/prompt.txt', {
      AGENT_ID: 'agent-123',
    });
    
    expect(result).toBe('Agent: agent-123, Unknown: [NOT PROVIDED]');
  });

  it('throws on missing file', () => {
    const error = new Error('ENOENT: no such file or directory');
    readFileSync.mockImplementation(() => {
      throw error;
    });
    
    expect(() => {
      loadPrompt('/nonexistent/path.txt', {});
    }).toThrow();
  });

  it('handles multiple placeholders of same variable', () => {
    readFileSync.mockReturnValue('{{VAR}} and {{VAR}} again');
    
    const result = loadPrompt('/path/to/prompt.txt', {
      VAR: 'value',
    });
    
    expect(result).toBe('value and value again');
  });

  it('preserves non-placeholder braces', () => {
    readFileSync.mockReturnValue('JSON: {key: "value"}, Var: {{VAR}}');
    
    const result = loadPrompt('/path/to/prompt.txt', {
      VAR: 'test',
    });
    
    expect(result).toBe('JSON: {key: "value"}, Var: test');
  });
});
