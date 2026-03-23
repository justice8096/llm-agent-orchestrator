/**
 * examples/adapter-usage.js
 *
 * Demonstrates how to use different LLM adapters with the AgentOrchestrator.
 */

import { AgentOrchestrator, MockLLMAdapter, OpenAIAdapter, AnthropicAdapter, OllamaAdapter, CustomLLMAdapter } from '../src/index.js';

// Example 1: Mock adapter for testing
export function exampleMockAdapter() {
  const mockBackend = new MockLLMAdapter({
    defaultResponse: {
      confidence: 0.9,
      updates: [
        {
          filePath: 'output.json',
          data: { test: 'mock result' }
        }
      ]
    },
    addDelay: true
  });

  const orchestrator = new AgentOrchestrator({
    agents: [
      { id: 'agent-1', label: 'Test Agent', wave: 0 }
    ],
    dependencyGraph: {
      waves: [{ wave: 0, label: 'Foundation' }],
      alwaysRunLast: []
    },
    promptsDir: './examples/prompts',
    outputDir: './output',
    llmBackend: mockBackend
  });

  return orchestrator;
}

// Example 2: OpenAI GPT adapter
export function exampleOpenAIAdapter() {
  // Requires OPENAI_API_KEY environment variable
  const openaiBackend = new OpenAIAdapter({
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000
  });

  const orchestrator = new AgentOrchestrator({
    agents: [
      { id: 'agent-1', label: 'Analysis Agent', wave: 0 }
    ],
    dependencyGraph: {
      waves: [{ wave: 0, label: 'Foundation' }],
      alwaysRunLast: []
    },
    promptsDir: './examples/prompts',
    outputDir: './output',
    llmBackend: openaiBackend
  });

  return orchestrator;
}

// Example 3: Anthropic Claude adapter
export function exampleAnthropicAdapter() {
  // Requires ANTHROPIC_API_KEY environment variable
  const claudeBackend = new AnthropicAdapter({
    model: 'claude-3-opus-20240229',
    maxTokens: 2000
  });

  const orchestrator = new AgentOrchestrator({
    agents: [
      { id: 'agent-1', label: 'Processing Agent', wave: 0 }
    ],
    dependencyGraph: {
      waves: [{ wave: 0, label: 'Foundation' }],
      alwaysRunLast: []
    },
    promptsDir: './examples/prompts',
    outputDir: './output',
    llmBackend: claudeBackend
  });

  return orchestrator;
}

// Example 4: Local Ollama adapter
export function exampleOllamaAdapter() {
  // Requires Ollama running locally
  const ollamaBackend = new OllamaAdapter({
    baseUrl: 'http://localhost:11434',
    model: 'mistral'
  });

  const orchestrator = new AgentOrchestrator({
    agents: [
      { id: 'agent-1', label: 'Local Agent', wave: 0 }
    ],
    dependencyGraph: {
      waves: [{ wave: 0, label: 'Foundation' }],
      alwaysRunLast: []
    },
    promptsDir: './examples/prompts',
    outputDir: './output',
    llmBackend: ollamaBackend
  });

  return orchestrator;
}

// Example 5: Custom adapter with your own function
export function exampleCustomAdapter() {
  const customBackend = new CustomLLMAdapter(async (prompt, context) => {
    // Your custom logic here
    console.log(`Processing agent: ${context.AGENT_LABEL}`);
    
    // Return JSON-formatted response
    return `\`\`\`json
    {
      "confidence": 0.85,
      "updates": [
        {
          "filePath": "custom-output.json",
          "data": { "custom": true, "timestamp": "${new Date().toISOString()}" }
        }
      ]
    }
    \`\`\``;
  });

  const orchestrator = new AgentOrchestrator({
    agents: [
      { id: 'agent-1', label: 'Custom Agent', wave: 0 }
    ],
    dependencyGraph: {
      waves: [{ wave: 0, label: 'Foundation' }],
      alwaysRunLast: []
    },
    promptsDir: './examples/prompts',
    outputDir: './output',
    llmBackend: customBackend
  });

  return orchestrator;
}

// Example 6: Running with different adapters
export async function demonstrateAdapterUsage() {
  console.log('\n=== Example 1: Mock Adapter ===');
  const mockOrch = exampleMockAdapter();
  const mockResult = await mockOrch.run({ agent: 'agent-1', dryRun: true });
  console.log(`Status: ${mockResult.results[0]?.status}`);

  console.log('\n=== Example 5: Custom Adapter ===');
  const customOrch = exampleCustomAdapter();
  const customResult = await customOrch.run({ agent: 'agent-1', dryRun: true });
  console.log(`Status: ${customResult.results[0]?.status}`);
}

// Uncomment to run demonstrations
// demonstrateAdapterUsage().catch(console.error);
