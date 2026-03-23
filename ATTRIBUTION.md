# Attribution

> Record of human and AI contributions to this project.

## Project

- **Name:** llm-agent-orchestrator
- **Repository:** https://github.com/justice8096/llm-agent-orchestrator
- **Started:** 2025 (embedded in retirementProject)

---

## Contributors

### Human

| Name | Role | Areas |
|------|------|-------|
| Justice E. Chase | Lead developer | Architecture, design, domain logic, review, integration |

### AI Tools Used

| Tool | Model/Version | Purpose |
|------|---------------|---------|
| Claude | Claude Opus 4.6 | Code generation, documentation, testing, research |
| Claude Code | — | Agentic development, refactoring, extraction |

---

## Contribution Log

### Original Source Code
Extracted from retirementProject/tools/agents/. Justice designed the wave-based execution model, dependency graphs, prompt template system, and refinement loops. This is significant architecture work.

| Date | Tag | Description | AI Tool | Human Review |
|------|-----|-------------|---------|--------------|
| 2025-2026 | `human-only` | Wave-based execution model, dependency graphs, prompt template system, refinement loops | — | Justice E. Chase |

### Standalone Extraction

| Date | Tag | Description | AI Tool | Human Review |
|------|-----|-------------|---------|--------------|
| 2026-03-21 | `ai-assisted` | Extracted from retirementProject into standalone repo, abstracted agent interface | Claude Code | Architecture decisions, reviewed all code |
| 2026-03-21 | `ai-assisted` | Pluggable LLM adapters (OpenAI, Anthropic, Ollama, Mock, Custom) | Claude Code | Reviewed and approved |
| 2026-03-21 | `ai-generated` | Package config, CI/CD workflows, LICENSE | Claude Code | Reviewed and approved |
| 2026-03-21 | `ai-generated` | README documentation | Claude Code | Reviewed, edited |

### Improvements (2026-03-23)

| Date | Tag | Description | AI Tool | Human Review |
|------|-----|-------------|---------|--------------|
| 2026-03-23 | `ai-generated` | TypeScript declarations (18+ types) | Claude Code | Reviewed and approved |
| 2026-03-23 | `ai-generated` | Example implementations and usage guides | Claude Code | Reviewed and edited |
| 2026-03-23 | `ai-generated` | Test suite with adapter integration tests | Claude Code | Reviewed and approved |

---

## Commit Convention

Include `[ai:claude]` tag in commit messages for AI-assisted or AI-generated changes. Example:
```
Extract agent orchestrator with LLM adapters [ai:claude]
```

---

## Disclosure Summary

| Category | Approximate % |
|----------|---------------|
| Human-only code | 35% |
| AI-assisted code | 30% |
| AI-generated (reviewed) | 35% |
| Documentation | 80% AI-assisted |
| Tests | 90% AI-generated |

---

## Notes

- All AI-generated or AI-assisted code is reviewed by a human contributor before merging.
- AI tools do not have repository access or commit privileges.
- This file is maintained manually and may not capture every interaction.
- Original source code was embedded in retirementProject before extraction.

---

## License Considerations

AI-generated content may have different copyright implications depending on jurisdiction. See [LICENSE](./LICENSE) for this project's licensing terms. Contributors are responsible for ensuring AI-assisted work complies with applicable policies.
