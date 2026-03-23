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


## LLM Compliance Integration
This project orchestrates LLM calls, making it subject to AI regulations (EU AI Act, NIST AI RMF, etc.) depending on deployment jurisdiction.

### Applicable Compliance Areas
- **Transparency Documentation** (Template 01) — Document the LLM models used, their capabilities, and limitations
- **Automated Decision Logic** (Template 04) — If agents make decisions affecting people, document the logic
- **Human Oversight Design** (Template 09) — Define oversight model for agent pipelines
- **Risk Classification** (Template 17) — Classify the AI system's risk tier under EU AI Act
- **Governance Framework** (Template 12) — Establish governance for multi-agent systems

### Using the Compliance Skill
The ai-compliance skill (skills/ai-compliance/) provides guidance on which regulations apply and how to collect evidence. Run the full pipeline:
1. `node extract-evidence.js --repo .` (from ai-compliance-extractors)
2. Fill interactive assessments (compliance-assessment-tools)
3. `node autofill.js` (from compliance-autofill)
