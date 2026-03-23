import { describe, it, expect, vi } from 'vitest';
import { AgentOrchestrator } from '../src/orchestrator.js';

describe('AgentOrchestrator', () => {
  const mockGraph = {
    waves: [
      { wave: 0, label: 'Foundation' },
      { wave: 1, label: 'Analysis' }
    ],
    alwaysRunLast: []
  };

  const mockAgents = [
    { id: 'agent-a', wave: 0, label: 'Agent A' },
    { id: 'agent-b', wave: 0, label: 'Agent B' },
    { id: 'agent-c', wave: 1, label: 'Agent C' }
  ];

  it('throws when targeting a nonexistent agent', async () => {
    const orch = new AgentOrchestrator({
      agents: mockAgents,
      dependencyGraph: mockGraph,
      promptsDir: '/tmp',
      outputDir: '/tmp',
      llmBackend: { generate: vi.fn() }
    });

    await expect(orch.run({ agent: 'nonexistent' })).rejects.toThrow('Agent not found');
  });

  it('runs only targeted wave', async () => {
    const generate = vi.fn().mockResolvedValue('```json\n{"status":"ok"}\n```');
    const orch = new AgentOrchestrator({
      agents: mockAgents,
      dependencyGraph: mockGraph,
      promptsDir: '/tmp',
      outputDir: '/tmp',
      llmBackend: { generate }
    });

    // This will fail at prompt loading but we can verify the wave filtering
    const result = await orch.run({ wave: 0, dryRun: true });
    // agent-c is wave 1, should not have been attempted
    const agentIds = result.results.map(r => r.agentId);
    expect(agentIds).not.toContain('agent-c');
  });

  it('returns report when requested', async () => {
    const orch = new AgentOrchestrator({
      agents: [],
      dependencyGraph: { waves: [] },
      promptsDir: '/tmp',
      outputDir: '/tmp',
      llmBackend: { generate: vi.fn() }
    });

    const result = await orch.run({ report: true });
    expect(result.report).toBeTruthy();
    expect(result.report.json).toBeTruthy();
    expect(result.report.markdown).toBeTruthy();
  });
});
