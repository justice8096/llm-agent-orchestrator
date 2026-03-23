/**
 * orchestrator.js — Main AgentOrchestrator class for wave-based agent execution.
 */

import { loadPrompt } from './lib/prompt-loader.js';
import { buildContext } from './lib/context-builder.js';
import { validateResult } from './lib/result-validator.js';
import { writeResults } from './lib/file-writer.js';
import { createReport } from './lib/run-report.js';

/**
 * AgentOrchestrator — Orchestrates multi-wave agent execution with dependency graph support.
 *
 * Agents are organized into waves. All agents within a wave can run in parallel.
 * Waves execute serially (wave 0 before wave 1, etc.), ensuring dependencies are satisfied.
 *
 * LLM backend is pluggable via the llmBackend option.
 */
export class AgentOrchestrator {
  /**
   * @param {object} config
   * @param {object[]} config.agents - Array of agent configs, each with { id, label, wave, ... }
   * @param {object} config.dependencyGraph - Wave definition { waves: [...], alwaysRunLast: [...] }
   * @param {string} config.promptsDir - Directory containing prompt template .md files
   * @param {string} config.outputDir - Directory for writing validated results
   * @param {object} config.llmBackend - { generate(prompt, context): Promise<string> }
   * @param {object} [config.options] - Additional options { dryRun, force, parallel, concurrency, report }
   */
  constructor({ agents, dependencyGraph, promptsDir, outputDir, llmBackend, options = {} }) {
    this.agents = agents;
    this.dependencyGraph = dependencyGraph;
    this.promptsDir = promptsDir;
    this.outputDir = outputDir;
    this.llmBackend = llmBackend;
    this.options = options;
    this.results = [];
  }

  /**
   * Execute a single agent or all agents across waves.
   *
   * @param {object} runConfig
   * @param {string} [runConfig.agent] - Run only this agent ID; if null, run all waves
   * @param {number} [runConfig.wave] - Run only this wave number (0-indexed)
   * @param {boolean} [runConfig.dryRun] - Validate and preview without writing
   * @param {boolean} [runConfig.force] - Ignore schedule checks
   * @param {boolean} [runConfig.parallel] - Run agents within a wave in parallel (default: serial)
   * @param {number} [runConfig.concurrency] - Max parallel agents (default: 4)
   * @param {boolean} [runConfig.report] - Generate run report
   * @returns {Promise<object>} { results, report }
   */
  async run(runConfig = {}) {
    const startTime = Date.now();
    const results = [];

    const {
      agent: targetAgent = null,
      wave: targetWave = null,
      dryRun = this.options.dryRun ?? false,
      force = this.options.force ?? false,
      parallel = this.options.parallel ?? false,
      concurrency = this.options.concurrency ?? 4,
      report: generateReport = this.options.report ?? false
    } = runConfig;

    // Build execution plan
    let agentsToRun = this.agents;
    if (targetAgent) {
      agentsToRun = this.agents.filter(a => a.id === targetAgent);
      if (agentsToRun.length === 0) {
        throw new Error(`Agent not found: ${targetAgent}`);
      }
    }

    const waves = targetWave !== null
      ? this.dependencyGraph.waves.filter(w => w.wave === targetWave)
      : this.dependencyGraph.waves;

    // Execute each wave serially; agents within a wave can run in parallel
    for (const waveConfig of waves) {
      const waveAgents = agentsToRun.filter(a => a.wave === waveConfig.wave);

      if (waveAgents.length === 0) continue;

      console.log(`\n[Wave ${waveConfig.wave}] ${waveConfig.label}`);

      if (parallel) {
        // Run agents in parallel with concurrency limit
        await this._runWaveParallel(waveAgents, concurrency, { dryRun, force }, results);
      } else {
        // Run agents serially
        for (const agent of waveAgents) {
          const result = await this._runAgent(agent, { dryRun, force });
          results.push(result);
        }
      }
    }

    // Run "always last" agents if present
    if (this.dependencyGraph.alwaysRunLast && !targetAgent) {
      const lastAgents = agentsToRun.filter(a =>
        this.dependencyGraph.alwaysRunLast.includes(a.id)
      );
      for (const agent of lastAgents) {
        const result = await this._runAgent(agent, { dryRun, force });
        results.push(result);
      }
    }

    this.results = results;

    let reportOutput = null;
    if (generateReport) {
      reportOutput = createReport(results, startTime);
    }

    return { results, report: reportOutput };
  }

  /**
   * Run a single agent: load prompt, build context, call LLM, validate, write results.
   *
   * @private
   * @param {object} agentConfig - Agent configuration
   * @param {object} options - { dryRun, force }
   * @returns {Promise<object>} Agent result { agentId, status, ... }
   */
  async _runAgent(agentConfig, options = {}) {
    const { dryRun = false } = options;
    const agentId = agentConfig.id;
    const startTime = Date.now();

    console.log(`  → ${agentId}...`);

    const result = {
      agentId,
      status: 'pending',
      locationsUpdated: [],
      locationsUnchanged: [],
      confidence: null,
      duration: null,
      errors: [],
      warnings: []
    };

    try {
      // Load prompt template
      const promptPath = `${this.promptsDir}/${agentId}.md`;
      const prompt = loadPrompt(promptPath);

      // Build context from data files
      const context = buildContext(agentConfig, this.promptsDir);

      // Call LLM backend
      const rawOutput = await this.llmBackend.generate(prompt, context);

      // Validate output
      const validation = validateResult(rawOutput, agentConfig);
      if (!validation.valid) {
        result.status = 'error';
        result.errors = validation.errors;
        result.warnings = validation.warnings;
        console.log(`    ✗ validation failed: ${validation.errors[0]}`);
        return result;
      }

      // Write validated results (unless dry-run)
      if (!dryRun) {
        const writeResult = writeResults(validation.parsed, agentConfig, { dryRun });
        result.locationsUpdated = writeResult.filesWritten;
      } else {
        console.log(`    (dry-run) Would write ${validation.parsed.updates?.length ?? 0} updates`);
      }

      result.status = 'success';
      result.confidence = validation.parsed.confidence ?? null;
      result.warnings = validation.warnings;
      console.log(`    ✓ success`);
    } catch (err) {
      result.status = 'error';
      result.errors = [err.message];
      console.log(`    ✗ ${err.message}`);
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Run agents within a wave in parallel with concurrency limit.
   *
   * @private
   * @param {object[]} agents - Agents to run
   * @param {number} concurrency - Max parallel executions
   * @param {object} options - { dryRun, force }
   * @param {object[]} results - Results array to push into
   * @returns {Promise<void>}
   */
  async _runWaveParallel(agents, concurrency, options, results) {
    const queue = [...agents];
    const inFlight = [];

    while (queue.length > 0 || inFlight.length > 0) {
      while (inFlight.length < concurrency && queue.length > 0) {
        const agent = queue.shift();
        const promise = this._runAgent(agent, options)
          .then(result => {
            results.push(result);
            inFlight.splice(inFlight.indexOf(promise), 1);
          })
          .catch(err => {
            console.error(`Agent ${agent.id} failed:`, err);
            inFlight.splice(inFlight.indexOf(promise), 1);
          });
        inFlight.push(promise);
      }

      if (inFlight.length > 0) {
        await Promise.race(inFlight);
      }
    }
  }
}
