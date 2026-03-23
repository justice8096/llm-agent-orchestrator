# Example Agent Prompt

**Agent:** {{AGENT_LABEL}}
**Run Date:** {{RUN_DATE}}

## Overview

This is an example prompt template for an agent. Use `{{VARIABLE_NAME}}` placeholders for context injection.

## Current Data

{{DATA_ROWS}}

## Task

Analyze the provided data and output a JSON object with your findings.

## Output Format

Return a JSON object with the following structure:

```json
{
  "confidence": 0.95,
  "updates": [
    {
      "filePath": "output.json",
      "data": {
        "result": "..."
      }
    }
  ]
}
```

## Notes

- Ensure all numeric values are reasonable.
- Explain any warnings or low-confidence assessments.
- Return valid JSON only.
