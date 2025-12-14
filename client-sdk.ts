/**
 * Tax Advisor Service Client SDK
 *
 * Use this SDK to easily integrate the tax advisor service into your application.
 *
 * @example
 * ```typescript
 * import { TaxAdvisorClient } from './client-sdk';
 *
 * const client = new TaxAdvisorClient('http://localhost:3000');
 * const response = await client.chat('What taxes do I need to pay?');
 * console.log(response);
 * ```
 */

export interface Message {
  role: "user" | "assistant";
  content: string | any[];
}

export interface ChatResponse {
  response: any[];
}

export interface ToolCallResponse {
  success: boolean;
  result?: any;
  error?: string;
}

export class TaxAdvisorClient {
  private baseUrl: string;
  private conversationHistory: Message[] = [];

  constructor(baseUrl: string = "http://localhost:3000") {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
  }

  /**
   * Send a message to the tax advisor and get a response
   * @param message - The user's question or message
   * @param options - Additional options
   * @returns The assistant's response
   */
  async chat(
    message: string,
    options: {
      /** Whether to maintain conversation history (default: true) */
      keepHistory?: boolean;
      /** Custom conversation history to use instead of the client's history */
      customHistory?: Message[];
    } = {}
  ): Promise<ChatResponse> {
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

    const data: ChatResponse = await response.json();

    if (keepHistory && !customHistory) {
      this.conversationHistory.push({ role: "user", content: message });
      this.conversationHistory.push({ role: "assistant", content: data.response });
    }

    return data;
  }

  /**
   * Call a specific MCP tool directly with parameters
   * @param toolName - Name of the tool to call
   * @param params - Parameters for the tool
   * @returns The tool execution result
   */
  async callTool(toolName: string, params: Record<string, any> = {}): Promise<any> {
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

    const data: ToolCallResponse = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Tool execution failed");
    }

    return data.result;
  }

  /**
   * Get the current conversation history
   */
  getHistory(): Message[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear the conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Set custom conversation history
   */
  setHistory(history: Message[]): void {
    this.conversationHistory = history;
  }

  /**
   * Check if the service is healthy
   */
  async healthCheck(): Promise<boolean> {
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
 */
export function extractText(response: ChatResponse): string {
  const textBlocks = response.response.filter((block: any) => block.type === "text");
  return textBlocks.map((block: any) => block.text).join("\n");
}

/**
 * Create a simple chat interface
 */
export async function simpleChatSession(baseUrl?: string) {
  const client = new TaxAdvisorClient(baseUrl);

  return {
    /**
     * Send a message and get text response
     */
    async ask(question: string): Promise<string> {
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
    async tool(toolName: string, params?: Record<string, any>) {
      return client.callTool(toolName, params);
    },
  };
}
