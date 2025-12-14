import { spawn, ChildProcess } from "child_process";
import { createInterface } from "readline";
let mcpProcess = null;
export async function initMCP() {
    mcpProcess = spawn("node", [process.env.MCP_PATH || "../tax-advisor-mcp/dist/index.js"]);
    // Handle MCP stdio communication
    // ... implementation depends on your MCP's interface
}
export async function callMCPTool(name, params) {
    // Send JSON-RPC to MCP process
    // Return result
}
//# sourceMappingURL=mcp-bridge.js.map