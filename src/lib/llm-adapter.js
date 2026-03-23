/**
 * llm-adapter.js — Pluggable LLM backend adapters.
 *
 * Provides abstract base class and concrete implementations for different LLM providers.
 * Allows easy swapping of LLM backends without changing orchestrator code.
 */

/**
 * Abstract base class for LLM backends.
 * Implement this interface to add support for a new LLM provider.
 */
export class LLMAdapter {
  /**
   * Generate a response from the LLM backend.
   *
   * @param {string} prompt - The full prompt text
   * @param {object} context - Context variables for the prompt
   * @returns {Promise<string>} Raw LLM output (typically containing JSON)
   * @throws {Error} If generation fails
   */
  async generate(prompt, context) {
    throw new Error('generate() must be implemented by subclass');
  }
}

/**
 * Mock LLM adapter for testing and development.
 * Returns a fixed JSON response or generates variations based on input.
 */
export class MockLLMAdapter extends LLMAdapter {
  /**
   * @param {object} options
   * @param {object} [options.defaultResponse] - Fixed response to return (default: valid JSON)
   * @param {boolean} [options.addDelay] - Simulate network latency with random delay (default: false)
   */
  constructor({ defaultResponse = null, addDelay = false } = {}) {
    super();
    this.defaultResponse = defaultResponse || {
      confidence: 0.95,
      updates: [
        {
          filePath: 'output.json',
          data: { result: 'mock-result', timestamp: new Date().toISOString() }
        }
      ]
    };
    this.addDelay = addDelay;
  }

  async generate(prompt, context) {
    if (this.addDelay) {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    }
    return `\`\`\`json\n${JSON.stringify(this.defaultResponse, null, 2)}\n\`\`\``;
  }
}

/**
 * OpenAI GPT adapter.
 * Requires OPENAI_API_KEY environment variable.
 */
export class OpenAIAdapter extends LLMAdapter {
  /**
   * @param {object} options
   * @param {string} [options.apiKey] - OpenAI API key (default: env.OPENAI_API_KEY)
   * @param {string} [options.model] - Model name (default: 'gpt-4')
   * @param {number} [options.temperature] - Temperature for sampling (default: 0.7)
   * @param {number} [options.maxTokens] - Max tokens in response (default: 2000)
   */
  constructor({
    apiKey = process.env.OPENAI_API_KEY,
    model = 'gpt-4',
    temperature = 0.7,
    maxTokens = 2000
  } = {}) {
    super();
    if (!apiKey) {
      throw new Error('OpenAI API key required. Set OPENAI_API_KEY or pass apiKey option.');
    }
    this.apiKey = apiKey;
    this.model = model;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
  }

  async generate(prompt, context) {
    const { default: fetch } = await import('node-fetch');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: this.temperature,
        max_tokens: this.maxTokens
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
}

/**
 * Anthropic Claude adapter.
 * Requires ANTHROPIC_API_KEY environment variable.
 */
export class AnthropicAdapter extends LLMAdapter {
  /**
   * @param {object} options
   * @param {string} [options.apiKey] - Anthropic API key (default: env.ANTHROPIC_API_KEY)
   * @param {string} [options.model] - Model name (default: 'claude-3-opus-20240229')
   * @param {number} [options.maxTokens] - Max tokens in response (default: 2000)
   */
  constructor({
    apiKey = process.env.ANTHROPIC_API_KEY,
    model = 'claude-3-opus-20240229',
    maxTokens = 2000
  } = {}) {
    super();
    if (!apiKey) {
      throw new Error('Anthropic API key required. Set ANTHROPIC_API_KEY or pass apiKey option.');
    }
    this.apiKey = apiKey;
    this.model = model;
    this.maxTokens = maxTokens;
  }

  async generate(prompt, context) {
    const { default: fetch } = await import('node-fetch');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  }
}

/**
 * Local LLM adapter via Ollama.
 * Requires Ollama running locally (default: http://localhost:11434).
 */
export class OllamaAdapter extends LLMAdapter {
  /**
   * @param {object} options
   * @param {string} [options.baseUrl] - Ollama base URL (default: 'http://localhost:11434')
   * @param {string} [options.model] - Model name (default: 'mistral')
   */
  constructor({
    baseUrl = 'http://localhost:11434',
    model = 'mistral'
  } = {}) {
    super();
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generate(prompt, context) {
    const { default: fetch } = await import('node-fetch');
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || '';
  }
}

/**
 * Wrapper for custom LLM backends.
 * Use this to adapt existing async functions to the LLMAdapter interface.
 */
export class CustomLLMAdapter extends LLMAdapter {
  /**
   * @param {Function} generatorFn - Async function(prompt, context) => string
   */
  constructor(generatorFn) {
    super();
    if (typeof generatorFn !== 'function') {
      throw new Error('CustomLLMAdapter requires an async function');
    }
    this.generatorFn = generatorFn;
  }

  async generate(prompt, context) {
    return this.generatorFn(prompt, context);
  }
}
