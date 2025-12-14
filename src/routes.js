import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic();
// Your MCP tools defined as Anthropic tools
const tools = [
    {
        name: "get_tax_obligations",
        description: "List all taxes the user is liable for",
        input_schema: {
            type: "object",
            properties: {
                year: { type: "number", description: "Tax year" }
            }
        }
    },
    {
        name: "calculate_tax_estimate",
        description: "Estimate tax liability",
        input_schema: {
            type: "object",
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
            type: "object",
            properties: {
                days_ahead: { type: "number", default: 30 }
            }
        }
    },
    {
        name: "search_dutch_tax_law",
        description: "Search Dutch tax regulations",
        input_schema: {
            type: "object",
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
            type: "object",
            properties: {
                focus: { type: "string" }
            }
        }
    }
];
export async function chatRoute(req, res) {
    const { message, history = [] } = req.body;
    if (!message) {
        return res.status(400).json({ error: "Message required" });
    }
    try {
        const response = await client.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
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
                model: "claude-sonnet-4-20250514",
                max_tokens: 1024,
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
    }
    catch (error) {
        console.error("Chat error:", error);
        res.status(500).json({ error: "Failed to process request" });
    }
}
async function executeToolLocally(toolName, input) {
    // TODO: Connect to your actual MCP server
    // For now, return mock responses
    console.log(`Executing tool: ${toolName}`, input);
    return { result: `Mock result for ${toolName}` };
}
//# sourceMappingURL=routes.js.map