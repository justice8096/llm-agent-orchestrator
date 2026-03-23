import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildContext } from '../../src/lib/context-builder.js';

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

import { readFileSync, existsSync } from 'fs';

describe('buildContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns RUN_DATE, AGENT_ID, AGENT_LABEL', () => {
    existsSync.mockReturnValue(false);
    
    const config = {
      id: 'test-agent',
      label: 'Test Agent',
      dataTargets: [],
    };
    
    const context = buildContext(config, '/data');
    
    expect(context.AGENT_ID).toBe('test-agent');
    expect(context.AGENT_LABEL).toBe('Test Agent');
    expect(context.RUN_DATE).toBeDefined();
  });

  it('loads target files and extracts data', () => {
    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue('{"user": "john", "email": "john@example.com"}');
    
    const config = {
      id: 'agent-1',
      label: 'Agent 1',
      dataTargets: [
        { filePath: 'users.json', contextKey: 'USER_DATA' },
      ],
    };
    
    const context = buildContext(config, '/data');
    
    expect(context.USER_DATA).toBeDefined();
    expect(typeof context.USER_DATA).toBe('string');
    expect(context.USER_DATA).toContain('john');
  });

  it('uses extractJsonPath for nested values', () => {
    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue('{"config": {"database": {"host": "localhost"}}}');
    
    const config = {
      id: 'agent-1',
      label: 'Agent 1',
      dataTargets: [
        {
          filePath: 'config.json',
          contextKey: 'DB_HOST',
          jsonPath: 'config.database.host',
        },
      ],
    };
    
    const context = buildContext(config, '/data');
    
    expect(context.DB_HOST).toBe('localhost');
  });

  it('handles missing target files gracefully', () => {
    existsSync.mockReturnValue(false);
    
    const config = {
      id: 'agent-1',
      label: 'Agent 1',
      dataTargets: [
        { filePath: 'missing.json', contextKey: 'MISSING_DATA' },
      ],
    };
    
    const context = buildContext(config, '/data');
    
    expect(context.AGENT_ID).toBe('agent-1');
    expect(context.MISSING_DATA).toBeUndefined();
  });

  it('handles JSON parse errors', () => {
    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue('invalid json {]');
    
    const config = {
      id: 'agent-1',
      label: 'Agent 1',
      dataTargets: [
        { filePath: 'bad.json', contextKey: 'BAD_DATA' },
      ],
    };
    
    const context = buildContext(config, '/data');
    
    expect(context.AGENT_ID).toBe('agent-1');
  });

  it('includes all base context keys', () => {
    existsSync.mockReturnValue(false);
    
    const config = {
      id: 'agent-test',
      label: 'Test Label',
      dataTargets: [],
    };
    
    const context = buildContext(config, '/data');
    
    expect('AGENT_ID' in context).toBe(true);
    expect('AGENT_LABEL' in context).toBe(true);
    expect('RUN_DATE' in context).toBe(true);
  });

  it('loads multiple data targets', () => {
    existsSync.mockReturnValue(true);
    readFileSync
      .mockReturnValueOnce('{"role": "admin"}')
      .mockReturnValueOnce('{"status": "active"}');
    
    const config = {
      id: 'agent-1',
      label: 'Agent 1',
      dataTargets: [
        { filePath: 'user.json', contextKey: 'USER_ROLE' },
        { filePath: 'status.json', contextKey: 'USER_STATUS' },
      ],
    };
    
    const context = buildContext(config, '/data');
    
    expect(context.USER_ROLE).toContain('admin');
    expect(context.USER_STATUS).toContain('active');
  });

  it('formats RUN_DATE as ISO string', () => {
    existsSync.mockReturnValue(false);
    
    const config = {
      id: 'agent-1',
      label: 'Agent 1',
      dataTargets: [],
    };
    
    const context = buildContext(config, '/data');
    
    expect(typeof context.RUN_DATE).toBe('string');
    expect(context.RUN_DATE).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });
});
