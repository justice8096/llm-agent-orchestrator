import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadPrompt } from '../src/lib/prompt-loader.js';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import os from 'os';

describe('loadPrompt', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = join(os.tmpdir(), 'prompt-loader-test-' + Date.now());
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('reads a plain prompt file', () => {
    const file = join(tmpDir, 'test.md');
    writeFileSync(file, 'Hello world');
    expect(loadPrompt(file)).toBe('Hello world');
  });

  it('interpolates {{VARIABLES}} from context', () => {
    const file = join(tmpDir, 'test.md');
    writeFileSync(file, 'Hello {{NAME}}, today is {{DATE}}');
    const result = loadPrompt(file, { NAME: 'Alice', DATE: '2026-01-01' });
    expect(result).toBe('Hello Alice, today is 2026-01-01');
  });

  it('replaces missing variables with [NOT PROVIDED]', () => {
    const file = join(tmpDir, 'test.md');
    writeFileSync(file, 'Hello {{UNKNOWN_VAR}}');
    const result = loadPrompt(file, {});
    expect(result).toBe('Hello [NOT PROVIDED]');
  });

  it('throws on missing file', () => {
    expect(() => loadPrompt('/nonexistent/path.md')).toThrow('Cannot read');
  });
});
