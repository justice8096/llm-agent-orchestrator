/**
 * context-builder.js — Build context objects for prompt interpolation.
 *
 * Reads agent config and data files, assembles context variables for prompt templates.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Build a context object for an agent's prompt template.
 *
 * @param {object} agentConfig - Agent configuration with targetFiles, targetPaths, etc.
 * @param {string} dataDir - Base directory containing data files
 * @returns {object} Context object with variables for prompt interpolation
 */
export function buildContext(agentConfig, dataDir = '.') {
  const runDate = new Date().toISOString().slice(0, 10);

  const context = {
    RUN_DATE: runDate,
    AGENT_ID: agentConfig.id || '',
    AGENT_LABEL: agentConfig.label || agentConfig.id || ''
  };

  // If agentConfig has targetFiles/targetPaths, extract data
  if (agentConfig.targetFiles) {
    const dataRows = [];
    for (const filePattern of agentConfig.targetFiles) {
      try {
        const filePath = resolve(dataDir, filePattern);
        if (existsSync(filePath)) {
          const data = JSON.parse(readFileSync(filePath, 'utf-8'));
          // Extract specific paths if defined
          if (agentConfig.targetPaths) {
            for (const jsonPath of agentConfig.targetPaths) {
              const value = extractJsonPath(data, jsonPath);
              if (value !== undefined) {
                dataRows.push({
                  file: filePattern,
                  path: jsonPath,
                  value: JSON.stringify(value)
                });
              }
            }
          } else {
            // Include entire file
            dataRows.push({
              file: filePattern,
              data: JSON.stringify(data, null, 2)
            });
          }
        }
      } catch (err) {
        console.warn(`[context-builder] Could not load ${filePattern}: ${err.message}`);
      }
    }
    context.DATA_ROWS = JSON.stringify(dataRows, null, 2);
  }

  return context;
}

/**
 * Extract a value from a JSON object via a dot-notation path.
 * E.g., "person.address.city" extracts obj.person.address.city
 *
 * @param {object} obj - Object to extract from
 * @param {string} path - Dot-notation path
 * @returns {any} Value at path, or undefined
 */
function extractJsonPath(obj, path) {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  return current;
}
