# LLM Agent Orchestrator

## Purpose
A wave-based agent pipeline runner with dependency graphs, serial/parallel execution, prompt management, result validation, source quality refinement, and run reporting. Designed for LLM-powered data pipelines.

## Tools & Stack
- **Node.js** (ESM modules)
- Pluggable LLM backends (Anthropic, OpenAI, Ollama)

## Directory Structure
```
src/
  orchestrator.js        — Main pipeline runner (wave execution, CLI)
  refiner.js             — Weekly prompt refinement engine
  lib/
    context-builder.js   — Builds context for each agent from data files
    prompt-loader.js     — Loads and interpolates markdown prompt templates
    result-validator.js  — Validates agent output against expected schema
    file-writer.js       — Writes agent results to data files
    run-report.js        — Generates run reports (timing, success/fail)
examples/
  prompts/               — Example prompt templates
  configs/               — Example dependency graph + schedule configs
```

## Key Commands
```bash
# Preview what agents will do
node src/orchestrator.js --dry-run

# Run a single agent
node src/orchestrator.js --agent <id>

# Run all agents in parallel
node src/orchestrator.js --parallel --concurrency 4

# Generate run report
node src/orchestrator.js --report

# Weekly prompt refinement
node src/refiner.js
```

## Architecture
Agents execute in waves defined by a dependency graph:
```json
{
  "waves": [
    { "wave": 0, "label": "Foundation", "agents": ["a", "b"] },
    { "wave": 1, "label": "Core", "agents": ["c", "d", "e"] }
  ]
}
```
Waves run serially; agents within a wave run in parallel (up to --concurrency).

## Technical Notes
- Prompt templates use markdown with {{variable}} interpolation
- Results are validated against JSON schemas before writing
- Refiner evaluates source quality scores and suggests prompt improvements
- Critical agents can gate downstream waves (skip if failed)
- All file I/O through lib/ modules (no direct fs calls in orchestrator)
