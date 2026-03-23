/**
 * result-validator.js — Validate LLM agent output.
 *
 * Extracts JSON from raw output, validates structure, checks field ranges.
 */

/**
 * Validate raw agent output.
 *
 * @param {string} rawOutput - Raw text output from LLM
 * @param {object} agentConfig - Agent configuration
 * @returns {{ valid: boolean, errors: string[], warnings: string[], parsed: object|null }}
 */
export function validateResult(rawOutput, agentConfig = {}) {
  const errors = [];
  const warnings = [];

  // Extract JSON block from raw output
  const jsonStr = extractJsonBlock(rawOutput);
  if (!jsonStr) {
    errors.push('No JSON block found in output');
    return { valid: false, errors, warnings, parsed: null };
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    errors.push(`JSON parse error: ${err.message}`);
    return { valid: false, errors, warnings, parsed: null };
  }

  // Basic validation
  if (typeof parsed !== 'object' || parsed === null) {
    errors.push('Top-level JSON must be an object');
    return { valid: false, errors, warnings, parsed: null };
  }

  // Optional: validate required fields if specified in agentConfig
  if (agentConfig.requiredFields) {
    for (const field of agentConfig.requiredFields) {
      if (!(field in parsed)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  // Optional: validate field ranges if specified
  if (agentConfig.fieldRanges) {
    for (const [field, range] of Object.entries(agentConfig.fieldRanges)) {
      if (field in parsed) {
        const value = parsed[field];
        if (typeof value === 'number') {
          if (value < range.min || value > range.max) {
            warnings.push(`Field ${field}=${value} outside expected range [${range.min}, ${range.max}]`);
          }
        }
      }
    }
  }

  const valid = errors.length === 0;
  return { valid, errors, warnings, parsed };
}

/**
 * Extract JSON code block from raw output.
 * Looks for ```json ... ``` or ```{...}``` patterns.
 *
 * @param {string} text - Raw output text
 * @returns {string|null} JSON string or null
 */
function extractJsonBlock(text) {
  // Try markdown json fence
  const jsonFenceMatch = text.match(/```json\s*\n([\s\S]*?)\n```/);
  if (jsonFenceMatch) return jsonFenceMatch[1];

  // Try generic code fence
  const codeFenceMatch = text.match(/```\s*\n([\s\S]*?)\n```/);
  if (codeFenceMatch) {
    const candidate = codeFenceMatch[1].trim();
    if (candidate.startsWith('{') || candidate.startsWith('[')) {
      return candidate;
    }
  }

  // Try plain JSON object/array
  const plainMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (plainMatch) return plainMatch[1];

  return null;
}
