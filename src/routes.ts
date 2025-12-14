import type { Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { callMCPTool } from "./mcp-bridge.js";

const client = new Anthropic();

// Your MCP tools defined as Anthropic tools
const tools = [
  {
    name: "get_tax_obligations",
    description: "List all taxes the user is liable for",
    input_schema: {
      type: "object" as const,
      properties: {
        year: { type: "number", description: "Tax year" }
      }
    }
  },
  {
    name: "calculate_tax_estimate",
    description: "Estimate tax liability",
    input_schema: {
      type: "object" as const,
      properties: {
        income: { type: "number" },
        deductions: { type: "number" }
      },
      required: ["income"]
    }
  },
  {
    name: "get_upcoming_dues",
    description: "Show upcoming payment deadlines",
    input_schema: {
      type: "object" as const,
      properties: {
        days_ahead: { type: "number", default: 30 }
      }
    }
  },
  {
    name: "search_dutch_tax_law",
    description: "Search Dutch tax regulations",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string" }
      },
      required: ["query"]
    }
  },
  {
    name: "get_spending_advice",
    description: "Get financial optimization tips",
    input_schema: {
      type: "object" as const,
      properties: {
        focus: { type: "string" }
      }
    }
  }
];

export async function chatRoute(req: Request, res: Response) {
  const { message, history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message required" });
  }

  try {
    const model = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";
    const maxTokens = parseInt(process.env.MAX_TOKENS || "1024");

    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: "You are a Dutch tax advisor assistant. Use the available tools to help users with tax questions. Be concise and helpful.",
      tools,
      messages: [
        ...history,
        { role: "user", content: message }
      ]
    });

    // Handle tool use if needed
    if (response.stop_reason === "tool_use") {
      const toolUse = response.content.find(c => c.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") {
        return res.status(500).json({ error: "Tool use expected but not found" });
      }

      const toolResult = await executeToolLocally(toolUse.name, toolUse.input);

      // Continue conversation with tool result
      const finalResponse = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system: "You are a Dutch tax advisor assistant.",
        tools,
        messages: [
          ...history,
          { role: "user", content: message },
          { role: "assistant", content: response.content },
          { role: "user", content: [{ type: "tool_result", tool_use_id: toolUse.id, content: JSON.stringify(toolResult) }] }
        ]
      });

      return res.json({ response: finalResponse.content });
    }

    res.json({ response: response.content });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
}

async function executeToolLocally(toolName: string, input: any) {
  try {
    console.log(`Executing tool: ${toolName}`, input);
    const result = await callMCPTool(toolName, input);
    return result;
  } catch (error) {
    console.error(`Failed to execute tool ${toolName}:`, error);
    // Return error as tool result so Claude can handle it
    return {
      error: error instanceof Error ? error.message : "Unknown error",
      toolName,
    };
  }
}

// Direct tool execution endpoint
export async function toolRoute(req: Request, res: Response) {
  const { toolName } = req.params;
  const params = req.body;

  if (!toolName) {
    return res.status(400).json({ error: "Tool name required" });
  }

  try {
    const result = await callMCPTool(toolName, params);
    res.json({ success: true, result });
  } catch (error) {
    console.error(`Tool execution error (${toolName}):`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

