---
name: llm-agent-orchestrator
description: Set up and configure wave-based LLM agent pipelines with dependency graphs
version: 0.1.0
---

# LLM Agent Orchestrator Skill

Use this skill when the user wants to build multi-step LLM agent pipelines with dependency management, parallel execution, and result validation.

## When to use
- User wants to orchestrate multiple LLM calls with dependencies between them
- User needs a pipeline where some agents run in parallel and others run sequentially
- User mentions "agent orchestration", "LLM pipeline", or "wave-based execution"

## How to use

1. Define a dependency graph in `configs/dependency-graph.json`:
   ```json
   {
     "waves": [
       { "name": "Foundation", "agents": ["research", "data-collection"], "parallel": true },
       { "name": "Analysis", "agents": ["analyzer"], "dependsOn": ["Foundation"] }
     ]
   }
   ```

2. Create prompt templates in `prompts/` as markdown files (one per agent)

3. Run the orchestrator:
   ```bash
   node orchestrator.js --config configs/dependency-graph.json
   ```

4. Dry-run mode (no LLM calls):
   ```bash
   node orchestrator.js --config configs/dependency-graph.json --dry-run
   ```

## Key concepts
- **Waves**: Groups of agents that execute together. Waves run serially; agents within a wave can run in parallel.
- **Dependency graph**: Defines which waves must complete before others start.
- **Prompt templates**: Markdown files with variable interpolation for dynamic context.
- **Result validation**: Each agent's output is validated against a schema before downstream agents consume it.
- **Refinement**: The refiner.js module can iteratively improve source quality on a schedule.
