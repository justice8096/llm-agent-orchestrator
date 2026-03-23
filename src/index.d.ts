/**
 * TypeScript type declarations for llm-agent-orchestrator
 */

/**
 * Configuration for a single agent in the orchestration pipeline.
 */
export interface AgentConfig {
  /** Unique identifier for the agent */
  id: string;
  
  /** Human-readable label for the agent */
  label: string;
  
  /** Wave number (0-indexed) in which this agent runs */
  wave: number;
  
  /** Optional: Array of file paths to load as context data */
  targetFiles?: string[];
  
  /** Optional: JSON paths (dot-notation) to extract from loaded files */
  targetPaths?: string[];
  
  /** Optional: Array of required field names in validated output */
  requiredFields?: string[];
  
  /** Optional: Field value range validation { [fieldName]: { min: number, max: number } } */
  fieldRanges?: Record<string, { min: number; max: number }>;
  
  /** Optional: Additional agent-specific configuration */
  [key: string]: any;
}

/**
 * Represents a single wave of agent execution.
 * All agents within a wave can run in parallel.
 */
export interface WaveConfig {
  /** Wave number (0-indexed) */
  wave: number;
  
  /** Human-readable label for the wave */
  label: string;
  
  /** Optional: List of agent IDs in this wave (for reference) */
  agents?: string[];
  
  /** Optional: Additional wave notes or metadata */
  notes?: string;
}

/**
 * Dependency graph defining wave structure and execution order.
 */
export interface DependencyGraph {
  /** Array of wave configurations */
  waves: WaveConfig[];
  
  /** Optional: Agent IDs that should always run last, after all waves */
  alwaysRunLast?: string[];
  
  /** Optional: Array of critical agent IDs that, if they fail, may skip subsequent waves */
  critical?: string[];
  
  /** Optional: Notes on critical agents behavior */
  criticalNote?: string;
  
  /** Optional: Additional metadata */
  [key: string]: any;
}

/**
 * Context object passed to LLM for prompt interpolation.
 * Contains template variables for prompt substitution.
 */
export interface PromptContext {
  /** ISO date string (YYYY-MM-DD) */
  RUN_DATE: string;
  
  /** Agent ID */
  AGENT_ID: string;
  
  /** Agent label */
  AGENT_LABEL: string;
  
  /** JSON-serialized data rows from loaded files */
  DATA_ROWS?: string;
  
  /** Additional custom context variables */
  [key: string]: any;
}

/**
 * LLM backend interface for generating agent responses.
 * Implement this interface to plug in different LLM providers.
 */
export interface LLMBackend {
  /**
   * Generate a response from the LLM.
   *
   * @param prompt - The full prompt text
   * @param context - Context variables for the prompt
   * @returns Promise resolving to the raw LLM output (typically containing JSON)
   */
  generate(prompt: string, context: PromptContext): Promise<string>;
}

/**
 * Output from a single agent update.
 * Contains the file path and data to write.
 */
export interface AgentUpdate {
  /** Path to the output file */
  filePath: string;
  
  /** Data object to write/merge into the file */
  data: Record<string, any>;
}

/**
 * Validated parsed output from an agent.
 */
export interface ValidatedAgentOutput {
  /** Confidence level of the agent's output (0-1 or null) */
  confidence?: number | null;
  
  /** Array of file updates to apply */
  updates?: AgentUpdate[];
  
  /** Additional fields from the agent's JSON output */
  [key: string]: any;
}

/**
 * Result of validating raw LLM output.
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  
  /** Array of error messages */\n  errors: string[];
  
  /** Array of warning messages */
  warnings: string[];
  
  /** Parsed and validated output, or null if validation failed */
  parsed: ValidatedAgentOutput | null;
}

/**
 * Result of running a single agent.
 */
export interface AgentResult {
  /** Agent ID */
  agentId: string;
  
  /** Execution status: 'pending', 'success', 'error' */
  status: 'pending' | 'success' | 'error';
  
  /** File paths that were updated */
  locationsUpdated: string[];
  
  /** File paths that were checked but not changed */
  locationsUnchanged: string[];
  
  /** Confidence level from agent output (0-1 or null) */
  confidence: number | null;
  
  /** Execution duration in milliseconds */
  duration: number | null;
  
  /** Error messages */
  errors: string[];
  
  /** Warning messages */
  warnings: string[];
}

/**
 * Report generated from a run.
 */
export interface RunReport {
  /** JSON representation of the report */
  json: {
    totalAgents: number;
    successful: number;
    failed: number;
    duration: number;
    timestamp: string;
    results: AgentResult[];
  };
  
  /** Markdown representation of the report */
  markdown: string;
}

/**
 * Result of executing orchestrator.run()
 */
export interface RunResult {
  /** Array of results from all agents */
  results: AgentResult[];
  
  /** Report object if requested, otherwise null */
  report: RunReport | null;
}

/**
 * Configuration for orchestrator run execution.
 */
export interface RunConfig {
  /** Target a single agent by ID; if null, run all agents */
  agent?: string | null;
  
  /** Target a specific wave number; if null, run all waves */
  wave?: number | null;
  
  /** Validate and preview without writing files */
  dryRun?: boolean;
  
  /** Ignore schedule checks */
  force?: boolean;
  
  /** Run agents within a wave in parallel */
  parallel?: boolean;
  
  /** Maximum parallel agents (default: 4) */
  concurrency?: number;
  
  /** Generate a run report */
  report?: boolean;
}

/**
 * Additional orchestrator options.
 */
export interface OrchestratorOptions {
  /** Default dryRun behavior */
  dryRun?: boolean;
  
  /** Default force behavior */
  force?: boolean;
  
  /** Default parallel behavior */
  parallel?: boolean;
  
  /** Default concurrency limit */
  concurrency?: number;
  
  /** Default report generation behavior */
  report?: boolean;
}

/**
 * Configuration for AgentOrchestrator constructor.
 */
export interface OrchestratorConfig {
  /** Array of agent configurations */
  agents: AgentConfig[];
  
  /** Dependency graph defining waves and execution order */
  dependencyGraph: DependencyGraph;
  
  /** Directory containing prompt template .md files */
  promptsDir: string;
  
  /** Directory for writing validated results */
  outputDir: string;
  
  /** LLM backend for generating agent responses */
  llmBackend: LLMBackend;
  
  /** Optional: Default options for runs */
  options?: OrchestratorOptions;
}

/**
 * Wave-based orchestrator for multi-agent LLM pipelines.
 *
 * Agents are organized into waves. All agents within a wave can run in parallel.
 * Waves execute serially (wave 0 before wave 1, etc.), ensuring dependencies are satisfied.
 *
 * The LLM backend is pluggable and can implement different providers.
 */
export class AgentOrchestrator {
  constructor(config: OrchestratorConfig);
  
  /** Agents array from configuration */
  agents: AgentConfig[];
  
  /** Dependency graph from configuration */
  dependencyGraph: DependencyGraph;
  
  /** Prompts directory from configuration */
  promptsDir: string;
  
  /** Output directory from configuration */
  outputDir: string;
  
  /** LLM backend from configuration */
  llmBackend: LLMBackend;
  
  /** Options from configuration */
  options: OrchestratorOptions;
  
  /** Results from the last run */
  results: AgentResult[];
  
  /**
   * Execute a single agent or all agents across waves.
   *
   * @param runConfig - Configuration for this run
   * @returns Promise resolving to execution results and optional report
   */
  run(runConfig?: RunConfig): Promise<RunResult>;
}

/**
 * Load a prompt template from a file.
 *
 * @param filePath - Path to the .md prompt template
 * @returns The prompt template text
 */
export function loadPrompt(filePath: string): string;

/**
 * Build context variables for prompt interpolation.
 *
 * @param agentConfig - Agent configuration
 * @param dataDir - Base directory containing data files
 * @returns Context object with variables for template substitution
 */
export function buildContext(agentConfig: AgentConfig, dataDir?: string): PromptContext;

/**
 * Validate raw agent output.
 *
 * @param rawOutput - Raw text output from the LLM
 * @param agentConfig - Agent configuration (optional)
 * @returns Validation result with errors, warnings, and parsed output
 */
export function validateResult(rawOutput: string, agentConfig?: AgentConfig): ValidationResult;

/**
 * Write validated agent results to output files.
 *
 * @param parsed - Validated parsed output
 * @param agentConfig - Agent configuration
 * @param options - Write options (e.g., dryRun)
 * @returns Object with filesWritten and backups arrays
 */
export function writeResults(
  parsed: ValidatedAgentOutput,
  agentConfig: AgentConfig,
  options?: { dryRun?: boolean }
): { filesWritten: string[]; backups: string[] };

/**
 * Create a run report from results.
 *
 * @param results - Array of agent results
 * @param startTime - Timestamp when run started (milliseconds)
 * @returns Report object with JSON and markdown representations
 */
export function createReport(results: AgentResult[], startTime: number): RunReport;

// ==================== LLM Adapters ====================

/**
 * Abstract base class for LLM backend adapters.
 * Extend this class to implement custom LLM providers.
 */
export abstract class LLMAdapter implements LLMBackend {
  /**
   * Generate a response from the LLM backend.
   *
   * @param prompt - The full prompt text
   * @param context - Context variables for the prompt
   * @returns Promise resolving to raw LLM output (typically containing JSON)
   * @throws Error if generation fails
   */
  abstract generate(prompt: string, context: PromptContext): Promise<string>;
}

/**
 * Mock LLM adapter for testing and development.
 * Returns a fixed JSON response or generates variations based on input.
 */
export class MockLLMAdapter extends LLMAdapter {
  /**
   * @param options - Configuration options
   * @param options.defaultResponse - Fixed response to return (default: valid JSON)
   * @param options.addDelay - Simulate network latency with random delay (default: false)
   */
  constructor(options?: { defaultResponse?: ValidatedAgentOutput; addDelay?: boolean });
  
  generate(prompt: string, context: PromptContext): Promise<string>;
}

/**
 * OpenAI GPT adapter.
 * Requires OPENAI_API_KEY environment variable or apiKey option.
 */
export class OpenAIAdapter extends LLMAdapter {
  /**
   * @param options - Configuration options
   * @param options.apiKey - OpenAI API key (default: env.OPENAI_API_KEY)
   * @param options.model - Model name (default: 'gpt-4')
   * @param options.temperature - Temperature for sampling (default: 0.7)
   * @param options.maxTokens - Max tokens in response (default: 2000)
   */
  constructor(options?: {
    apiKey?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  });
  
  generate(prompt: string, context: PromptContext): Promise<string>;
}

/**
 * Anthropic Claude adapter.
 * Requires ANTHROPIC_API_KEY environment variable or apiKey option.
 */
export class AnthropicAdapter extends LLMAdapter {
  /**
   * @param options - Configuration options
   * @param options.apiKey - Anthropic API key (default: env.ANTHROPIC_API_KEY)
   * @param options.model - Model name (default: 'claude-3-opus-20240229')
   * @param options.maxTokens - Max tokens in response (default: 2000)
   */
  constructor(options?: {
    apiKey?: string;
    model?: string;
    maxTokens?: number;
  });
  
  generate(prompt: string, context: PromptContext): Promise<string>;
}

/**
 * Local LLM adapter via Ollama.
 * Requires Ollama running locally (default: http://localhost:11434).
 */
export class OllamaAdapter extends LLMAdapter {
  /**
   * @param options - Configuration options
   * @param options.baseUrl - Ollama base URL (default: 'http://localhost:11434')
   * @param options.model - Model name (default: 'mistral')
   */
  constructor(options?: { baseUrl?: string; model?: string });
  
  generate(prompt: string, context: PromptContext): Promise<string>;
}

/**
 * Wrapper for custom LLM backends.
 * Use this to adapt existing async functions to the LLMAdapter interface.
 */
export class CustomLLMAdapter extends LLMAdapter {
  /**
   * @param generatorFn - Async function(prompt, context) => string
   */
  constructor(generatorFn: (prompt: string, context: PromptContext) => Promise<string>);
  
  generate(prompt: string, context: PromptContext): Promise<string>;
}
