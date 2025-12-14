/**
 * Tax Advisor Service Client SDK (JavaScript)
 *
 * Use this SDK to easily integrate the tax advisor service into your application.
 *
 * @example
 * ```javascript
 * const { TaxAdvisorClient } = require('./client-sdk.js');
 *
 * const client = new TaxAdvisorClient('http://localhost:3000');
 * const response = await client.chat('What taxes do I need to pay?');
 * console.log(response);
 * ```
 */

export class TaxAdvisorClient {
  constructor(baseUrl = "http://localhost:3000") {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.conversationHistory = [];
  }

  /**
   * Send a message to the tax advisor and get a response
   * @param {string} message - The user's question or message
   * @param {Object} options - Additional options
   * @param {boolean} options.keepHistory - Whether to maintain conversation history (default: true)
   * @param {Array} options.customHistory - Custom conversation history to use
   * @returns {Promise<Object>} The assistant's response
   */
  async chat(message, options = {}) {
    const { keepHistory = true, customHistory } = options;
    const history = customHistory || (keepHistory ? this.conversationHistory : []);

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        history,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`Chat failed: ${error.error || response.statusText}`);
    }

    const data = await response.json();

    if (keepHistory && !customHistory) {
      this.conversationHistory.push({ role: "user", content: message });
      this.conversationHistory.push({ role: "assistant", content: data.response });
    }

    return data;
  }

  /**
   * Call a specific MCP tool directly with parameters
   * @param {string} toolName - Name of the tool to call
   * @param {Object} params - Parameters for the tool
   * @returns {Promise<any>} The tool execution result
   */
  async callTool(toolName, params = {}) {
    const response = await fetch(`${this.baseUrl}/api/tools/${toolName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`Tool call failed: ${error.error || response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Tool execution failed");
    }

    return data.result;
  }

  /**
   * Get the current conversation history
   */
  getHistory() {
    return [...this.conversationHistory];
  }

  /**
   * Clear the conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Set custom conversation history
   */
  setHistory(history) {
    this.conversationHistory = history;
  }

  /**
   * Check if the service is healthy
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      return data.status === "ok";
    } catch {
      return false;
    }
  }
}

/**
 * Convenience function to extract text from Claude's response
 * @param {Object} response - The chat response
 * @returns {string} Extracted text
 */
export function extractText(response) {
  const textBlocks = response.response.filter((block) => block.type === "text");
  return textBlocks.map((block) => block.text).join("\n");
}

/**
 * Create a simple chat interface
 * @param {string} baseUrl - Base URL of the service
 * @returns {Promise<Object>} Simple chat interface
 */
export async function simpleChatSession(baseUrl) {
  const client = new TaxAdvisorClient(baseUrl);

  return {
    /**
     * Send a message and get text response
     */
    async ask(question) {
      const response = await client.chat(question);
      return extractText(response);
    },

    /**
     * Clear conversation history
     */
    clear() {
      client.clearHistory();
    },

    /**
     * Get conversation history
     */
    history() {
      return client.getHistory();
    },

    /**
     * Call a tool directly
     */
    async tool(toolName, params) {
      return client.callTool(toolName, params);
    },
  };
}
