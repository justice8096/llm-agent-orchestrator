/**
 * file-writer.js — Write validated agent results to data files.
 *
 * Creates backups and merges validated updates into target files.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs';
import { dirname } from 'path';

/**
 * Write parsed agent results to output files, creating backups.
 *
 * @param {object} parsed - Validated parsed output
 * @param {object} agentConfig - Agent configuration
 * @param {object} options - { dryRun: boolean }
 * @returns {{ filesWritten: string[], backups: string[] }}
 */
export function writeResults(parsed, agentConfig, options = {}) {
  const { dryRun = false } = options;
  const filesWritten = [];
  const backups = [];

  if (!parsed.updates || !Array.isArray(parsed.updates)) {
    console.log('[file-writer] No updates to write');
    return { filesWritten, backups };
  }

  const updates = parsed.updates;
  const timestamp = new Date().toISOString().slice(0, 10);

  for (const update of updates) {
    if (!update.filePath) continue;

    const filePath = update.filePath;
    const parentDir = dirname(filePath);

    // Create parent directory if needed
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true });
    }

    // Read current file
    let currentData = {};
    if (existsSync(filePath)) {
      try {
        currentData = JSON.parse(readFileSync(filePath, 'utf-8'));
      } catch (err) {
        console.error(`[file-writer] Could not parse ${filePath}: ${err.message}`);
        continue;
      }

      // Create backup
      if (!dryRun) {
        const backupPath = `${filePath}.backup-${timestamp}`;
        try {
          copyFileSync(filePath, backupPath);
          backups.push(backupPath);
        } catch (err) {
          console.warn(`[file-writer] Backup failed for ${filePath}: ${err.message}`);
        }
      }
    }

    // Merge updates
    const mergedData = mergeObjects(currentData, update.data || {});

    // Write result (unless dry-run)
    if (!dryRun) {
      try {
        writeFileSync(filePath, JSON.stringify(mergedData, null, 2) + '\n', 'utf-8');
        filesWritten.push(filePath);
        console.log(`[file-writer] Wrote: ${filePath}`);
      } catch (err) {
        console.error(`[file-writer] Write failed for ${filePath}: ${err.message}`);
      }
    } else {
      filesWritten.push(filePath);
      console.log(`[file-writer] (dry-run) Would write: ${filePath}`);
    }
  }

  return { filesWritten, backups };
}

/**
 * Deep merge two objects. Values from source override values in target.
 *
 * @param {object} target - Base object
 * @param {object} source - Updates to merge in
 * @returns {object} Merged result
 */
function mergeObjects(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceVal = source[key];
      const targetVal = target[key];
      if (
        sourceVal &&
        typeof sourceVal === 'object' &&
        !Array.isArray(sourceVal) &&
        targetVal &&
        typeof targetVal === 'object' &&
        !Array.isArray(targetVal)
      ) {
        result[key] = mergeObjects(targetVal, sourceVal);
      } else {
        result[key] = sourceVal;
      }
    }
  }
  return result;
}
