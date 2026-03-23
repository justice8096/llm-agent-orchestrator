import { describe, it, expect } from 'vitest';
import { createReport } from '../src/lib/run-report.js';

describe('createReport', () => {
  const mockResults = [
    { agentId: 'agent-1', status: 'success', duration: 1500, errors: [], warnings: [], locationsUpdated: ['file1.json'] },
    { agentId: 'agent-2', status: 'error', duration: 800, errors: ['timeout'], warnings: [], locationsUpdated: [] },
    { agentId: 'agent-3', status: 'success', duration: 2000, errors: [], warnings: ['low confidence'], locationsUpdated: ['file2.json'] }
  ];

  it('generates correct summary counts', () => {
    const report = createReport(mockResults, Date.now() - 5000);
    expect(report.json.summary.succeeded).toBe(2);
    expect(report.json.summary.failed).toBe(1);
    expect(report.json.agentCount).toBe(3);
  });

  it('includes timestamp and duration', () => {
    const start = Date.now() - 3000;
    const report = createReport(mockResults, start);
    expect(report.json.timestamp).toBeTruthy();
    expect(report.json.totalDurationSec).toBeGreaterThan(0);
  });

  it('generates markdown with agent details', () => {
    const report = createReport(mockResults, Date.now() - 1000);
    expect(report.markdown).toContain('agent-1');
    expect(report.markdown).toContain('agent-2');
    expect(report.markdown).toContain('timeout');
    expect(report.markdown).toContain('✓');
    expect(report.markdown).toContain('✗');
  });

  it('includes per-agent duration in seconds', () => {
    const report = createReport(mockResults, Date.now());
    const agent1 = report.json.agents.find(a => a.agentId === 'agent-1');
    expect(agent1.durationSec).toBe(1.5);
  });
});
