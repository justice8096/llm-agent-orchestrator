import { describe, it, expect } from 'vitest';
import { createReport } from '../../src/lib/run-report.js';

describe('createReport', () => {
  it('generates JSON report with summary counts', () => {
    const results = [
      { agentId: 'agent-1', status: 'success', output: 'Done' },
      { agentId: 'agent-2', status: 'success', output: 'Done' },
      { agentId: 'agent-3', status: 'failed', error: 'Error occurred' },
    ];
    const startTime = Date.now() - 5000;
    
    const report = createReport(results, startTime);
    
    expect(report.summary).toBeDefined();
    expect(report.summary.total).toBe(3);
    expect(report.summary.successful).toBe(2);
    expect(report.summary.failed).toBe(1);
  });

  it('generates markdown with agent statuses', () => {
    const results = [
      { agentId: 'agent-1', status: 'success', output: 'Completed' },
      { agentId: 'agent-2', status: 'failed', error: 'Failed operation' },
    ];
    const startTime = Date.now() - 3000;
    
    const report = createReport(results, startTime);
    
    expect(report.markdown).toBeDefined();
    expect(report.markdown).toContain('agent-1');
    expect(report.markdown).toContain('agent-2');
    expect(report.markdown).toContain('success');
    expect(report.markdown).toContain('failed');
  });

  it('handles empty results array', () => {
    const startTime = Date.now() - 1000;
    
    const report = createReport([], startTime);
    
    expect(report.summary).toBeDefined();
    expect(report.summary.total).toBe(0);
    expect(report.summary.successful).toBe(0);
    expect(report.summary.failed).toBe(0);
  });

  it('calculates duration correctly', () => {
    const results = [{ agentId: 'agent-1', status: 'success', output: 'Done' }];
    const startTime = Date.now() - 5000;
    
    const report = createReport(results, startTime);
    
    expect(report.duration).toBeDefined();
    expect(report.duration).toBeGreaterThanOrEqual(5000);
    expect(report.duration).toBeLessThan(6000);
  });

  it('includes all agent details in report', () => {
    const results = [
      {
        agentId: 'agent-1',
        status: 'success',
        output: 'Task completed',
        timestamp: '2026-03-23T10:00:00Z',
      },
    ];
    const startTime = Date.now() - 1000;
    
    const report = createReport(results, startTime);
    
    expect(report.agents).toBeDefined();
    expect(report.agents[0].id).toBe('agent-1');
    expect(report.agents[0].status).toBe('success');
  });

  it('formats timestamp in report', () => {
    const results = [{ agentId: 'agent-1', status: 'success', output: 'Done' }];
    const startTime = Date.now() - 1000;
    
    const report = createReport(results, startTime);
    
    expect(report.timestamp).toBeDefined();
    expect(typeof report.timestamp).toBe('string');
  });

  it('calculates success rate percentage', () => {
    const results = [
      { agentId: 'agent-1', status: 'success', output: 'Done' },
      { agentId: 'agent-2', status: 'success', output: 'Done' },
      { agentId: 'agent-3', status: 'failed', error: 'Error' },
      { agentId: 'agent-4', status: 'failed', error: 'Error' },
    ];
    const startTime = Date.now() - 2000;
    
    const report = createReport(results, startTime);
    
    expect(report.summary.successRate).toBe(50);
  });
});
