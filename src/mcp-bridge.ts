import { spawn, type ChildProcess } from "child_process";
import { createInterface, type Interface } from "readline";

interface MCPRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: "2.0";
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

class MCPBridge {
  private process: ChildProcess | null = null;
  private readline: Interface | null = null;
  private pendingRequests: Map<number, { resolve: (value: any) => void; reject: (error: any) => void }> = new Map();
  private requestId = 0;
  private httpUrl: string | null = null;
  private type: "stdio" | "http";

  constructor(type: "stdio" | "http" = "stdio") {
    this.type = type;
  }

  async init(pathOrUrl: string) {
    if (this.type === "http") {
      this.httpUrl = pathOrUrl;
      console.log(`MCP Bridge initialized in HTTP mode: ${pathOrUrl}`);
      return;
    }

    // stdio mode
    console.log(`Starting MCP server: ${pathOrUrl}`);
    this.process = spawn("node", [pathOrUrl], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (!this.process.stdout || !this.process.stdin) {
      throw new Error("Failed to create MCP process stdio streams");
    }

    this.readline = createInterface({
      input: this.process.stdout,
      crlfDelay: Infinity,
    });

    this.readline.on("line", (line) => {
      try {
        const response: MCPResponse = JSON.parse(line);
        const pending = this.pendingRequests.get(response.id);

        if (pending) {
          this.pendingRequests.delete(response.id);

          if (response.error) {
            pending.reject(new Error(response.error.message));
          } else {
            pending.resolve(response.result);
          }
        }
      } catch (error) {
        console.error("Failed to parse MCP response:", line, error);
      }
    });

    this.process.stderr?.on("data", (data) => {
      console.error("MCP stderr:", data.toString());
    });

    this.process.on("error", (error) => {
      console.error("MCP process error:", error);
    });

    this.process.on("exit", (code) => {
      console.log(`MCP process exited with code ${code}`);
      this.cleanup();
    });

    // Initialize MCP protocol
    await this.sendRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "tax-advisor-service",
        version: "1.0.0",
      },
    });

    console.log("MCP Bridge initialized successfully");
  }

  private async sendRequest(method: string, params?: any): Promise<any> {
    if (this.type === "http") {
      return this.sendHttpRequest(method, params);
    }

    return this.sendStdioRequest(method, params);
  }

  private async sendHttpRequest(method: string, params?: any): Promise<any> {
    if (!this.httpUrl) {
      throw new Error("HTTP URL not configured");
    }

    const response = await fetch(`${this.httpUrl}/rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: ++this.requestId,
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const data: MCPResponse = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.result;
  }

  private async sendStdioRequest(method: string, params?: any): Promise<any> {
    if (!this.process?.stdin) {
      throw new Error("MCP process not initialized");
    }

    const id = ++this.requestId;
    const request: MCPRequest = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request ${id} timed out`));
      }, 30000); // 30 second timeout

      this.pendingRequests.set(id, {
        resolve: (value) => {
          clearTimeout(timeout);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });

      this.process!.stdin!.write(JSON.stringify(request) + "\n");
    });
  }

  async callTool(name: string, args?: any): Promise<any> {
    try {
      const result = await this.sendRequest("tools/call", {
        name,
        arguments: args || {},
      });
      return result;
    } catch (error) {
      console.error(`Failed to call tool ${name}:`, error);
      throw error;
    }
  }

  async listTools(): Promise<any[]> {
    try {
      const result = await this.sendRequest("tools/list");
      return result.tools || [];
    } catch (error) {
      console.error("Failed to list tools:", error);
      return [];
    }
  }

  cleanup() {
    if (this.readline) {
      this.readline.close();
      this.readline = null;
    }

    if (this.process) {
      this.process.kill();
      this.process = null;
    }

    this.pendingRequests.clear();
  }
}

// Singleton instance
let mcpBridge: MCPBridge | null = null;

export async function initMCP() {
  const mcpType = (process.env.MCP_TYPE || "stdio") as "stdio" | "http";
  const pathOrUrl = mcpType === "http"
    ? process.env.MCP_HTTP_URL
    : process.env.MCP_PATH;

  if (!pathOrUrl) {
    console.warn("MCP not configured. Set MCP_PATH or MCP_HTTP_URL in .env");
    return;
  }

  mcpBridge = new MCPBridge(mcpType);
  await mcpBridge.init(pathOrUrl);
}

export async function callMCPTool(name: string, params: any): Promise<any> {
  if (!mcpBridge) {
    throw new Error("MCP bridge not initialized. Call initMCP() first.");
  }

  return mcpBridge.callTool(name, params);
}

export async function listMCPTools(): Promise<any[]> {
  if (!mcpBridge) {
    throw new Error("MCP bridge not initialized. Call initMCP() first.");
  }

  return mcpBridge.listTools();
}

export function cleanupMCP() {
  if (mcpBridge) {
    mcpBridge.cleanup();
    mcpBridge = null;
  }
}

// Cleanup on process exit
process.on("SIGINT", cleanupMCP);
process.on("SIGTERM", cleanupMCP);
