/**
 * prompt-loader.js — Load and interpolate prompt templates.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Load a prompt .md file and interpolate {{VARIABLE}} placeholders.
 *
 * @param {string} promptPath - Path to prompt file
 * @param {object} [contextObject] - Variables for {{VARIABLE}} substitution
 * @returns {string} Interpolated prompt
 * @throws {Error} If file cannot be read or parsed
 */
export function loadPrompt(promptPath, contextObject = {}) {
  let template;
  try {
    template = readFileSync(promptPath, 'utf-8');
  } catch (err) {
    throw new Error(`prompt-loader: Cannot read ${promptPath}: ${err.message}`);
  }

  // Replace {{VARIABLE_NAME}} with values from context
  const result = template.replace(/\{\{([A-Z_][A-Z0-9_]*)\}\}/g, (match, varName) => {
    if (varName in contextObject) {
      return String(contextObject[varName]);
    }
    console.warn(`[prompt-loader] Variable {{${varName}}} not in context, using [NOT PROVIDED]`);
    return '[NOT PROVIDED]';
  });

  return result;
}
