# llm-agent-orchestrator

A lightweight, pluggable orchestrator for multi-agent LLM pipelines with wave-based execution and dependency management.

## Features

- **Wave-based execution**: Agents organized into sequential waves; agents within a wave run in parallel
- **Dependency graph**: Define dependencies between agents to ensure correct execution order
- **Pluggable LLM backend**: Use any LLM API (Claude, OpenAI, etc.) via a simple interface
- **Prompt templates**: Markdown-based prompts with variable interpolation
- **Validation**: Built-in JSON validation with configurable field ranges
- **Result persistence**: Automatic result writing with backup management
- **Reporting**: Generate execution reports with timing and status summaries

## Installation

```bash
npm install llm-agent-orchestrator
```

## Quick Start

```javascript
import { AgentOrchestrator } from 'llm-agent-orchestrator';

// Define your LLM backend
const llmBackend = {
  async generate(prompt, context) {
    // Call Claude, OpenAI, or your chosen LLM
    // Return the raw output string
    const response = await fetch('https://api.anthropic.com/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
    return data.content[0].text;
  }
};

// Define your agents and dependency graph
const agents = [
  { id: 'rate-fetch', label: 'Fetch Exchange Rates', wave: 0 },
  { id: 'transform', label: 'Transform Data', wave: 1 },
  { id: 'report', label: 'Generate Report', wave: 2 }
];

const dependencyGraph = {
  waves: [
    { wave: 0, label: 'Foundation', agents: ['rate-fetch'] },
    { wave: 1, label: 'Processing', agents: ['transform'] },
    { wave: 2, label: 'Output', agents: ['report'] }
  ]
};

// Create and run orchestrator
const orchestrator = new AgentOrchestrator({
  agents,
  dependencyGraph,
  promptsDir: './prompts',
  outputDir: './output',
  llmBackend
});

const { results, report } = await orchestrator.run({
  parallel: true,
  concurrency: 4,
  report: true
});
```

## Configuration

### Agent Config

```javascript
{
  id: 'agent-id',                    // Unique identifier
  label: 'Agent Label',              // Display name
  wave: 0,                           // Wave number (0-indexed)
  targetFiles: ['data/file.json'],   // Files to read for context
  targetPaths: ['field.subfield'],   // JSON paths to extract
  requiredFields: ['result'],        // Required output fields
  fieldRanges: {                     // Optional field validation ranges
    value: { min: 0, max: 100 }
  }
}
```

### Dependency Graph

```javascript
{
  waves: [
    {
      wave: 0,
      label: 'Foundation',
      agents: ['agent-id-1', 'agent-id-2'],
      notes: 'Optional description'
    },
    // ... more waves
  ],
  alwaysRunLast: ['cleanup-agent'],  // Agents that run after all waves
  critical: ['rate-fetch'],          // Agents that must succeed
  criticalNote: 'If rate-fetch fails, skip wave 1'
}
```

### Run Options

```javascript
await orchestrator.run({
  agent: null,           // Run single agent by ID, or null for all
  wave: null,            // Run single wave by number, or null for all
  dryRun: false,         // Preview without writing files
  force: false,          // Ignore scheduling checks
  parallel: true,        // Run agents within wave in parallel
  concurrency: 4,        // Max concurrent agents
  report: true           // Generate execution report
});
```

## LLM Backend Interface

Your LLM backend must implement this interface:

```typescript
interface LLMBackend {
  generate(prompt: string, context: Record<string, string>): Promise<string>
}
```

The `prompt` is the full markdown prompt string. The `context` is a key-value object with variables for interpolation.

The backend should return raw text output. The orchestrator will extract and validate JSON.

## Prompt Templates

Prompts are markdown files in `promptsDir` with variable placeholders:

```markdown
# Agent Prompt

**Run Date:** {{RUN_DATE}}
**Agent:** {{AGENT_LABEL}}

## Data

{{DATA_ROWS}}

## Task

Analyze and return JSON with your findings.
```

Available variables depend on `context-builder.js` but always include:
- `{{RUN_DATE}}` — ISO date of execution
- `{{AGENT_ID}}` — Agent identifier
- `{{AGENT_LABEL}}` — Agent display name
- `{{DATA_ROWS}}` — Loaded data as JSON

## Output Format

Agents must return JSON (in markdown fence or plain):

```json
{
  "confidence": 0.95,
  "updates": [
    {
      "filePath": "output/result.json",
      "data": { "field": "value" }
    }
  ]
}
```

## Wave Execution

Waves execute in order. All agents within a wave:
- Start after the previous wave completes
- Run in parallel (or serially with `parallel: false`)
- Are limited by `concurrency` setting

Example flow:
```
Wave 0: [agent-A, agent-B] → both run in parallel
        ↓ (both complete)
Wave 1: [agent-C, agent-D, agent-E] → all three run in parallel, max 4 concurrency
        ↓ (all complete)
Wave 2: [agent-F] → cleanup tasks
```

## Result Validation

The orchestrator extracts JSON from raw output and validates:
- JSON structure is valid
- Required fields are present (if configured)
- Numeric fields are within ranges (if configured)

Invalid output is logged; the agent status is set to `'error'`.

## File Writing

When agents succeed, results are merged into target files:
- Backups are created with `.backup-YYYY-MM-DD` suffix
- Deep merging preserves unmodified fields
- Dry-run previews without writing

## Reporting

Reports include:
- Execution timestamp and total duration
- Per-agent status, duration, errors, warnings
- Files written and backup paths
- JSON and markdown formats

```javascript
const { report } = await orchestrator.run({ report: true });
console.log(report.markdown);  // Pretty text report
console.log(report.json);      // Detailed JSON
```

## License

MIT © 2026 Justice E. Chase
