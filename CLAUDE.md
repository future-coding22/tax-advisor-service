# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Dutch tax advisor service that provides an HTTP API for tax-related queries. It uses Claude AI (via Anthropic SDK) with custom tools to answer tax questions. The service is designed to integrate with a separate MCP (Model Context Protocol) server for actual tax data and calculations.

## Architecture

**Core Components:**

- **Express API Server** (`src/index.ts`): Entry point that sets up HTTP server with CORS, health check endpoint, and chat route
- **Chat Route Handler** (`src/routes.ts`): Manages Claude AI conversations with tool use capability. Implements agentic loop where Claude can call tools and receive results.
- **MCP Bridge** (`src/mcp-bridge.ts`): Stub implementation for connecting to external MCP server via stdio/JSON-RPC (currently returns mock data)

**Tool System:**

The service defines 5 tax-related tools for Claude in `src/routes.ts`:
- `get_tax_obligations`: List taxes user is liable for
- `calculate_tax_estimate`: Estimate tax liability from income/deductions
- `get_upcoming_dues`: Show payment deadlines
- `search_dutch_tax_law`: Search Dutch tax regulations
- `get_spending_advice`: Get financial optimization tips

Currently, `executeToolLocally()` returns mock responses. The TODO is to connect this to an actual MCP server via the mcp-bridge module.

**Conversation Flow:**

1. POST request to `/api/chat` with `message` and optional `history` array
2. First API call to Claude with tools and message
3. If Claude requests tool use (stop_reason === "tool_use"), execute tool locally
4. Second API call to Claude with tool result to get final response
5. Return response to client

## Development Commands

**Setup:**
```bash
npm install
npm run setup        # Interactive configuration wizard (recommended)
# Or manually copy env.example to .env and configure
```

**Development:**
```bash
npm run dev          # Run with hot reload using tsx watch
```

**Production Build:**
```bash
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled code from dist/index.js
```

**Docker:**
```bash
docker-compose up    # Run service in container (port 3029:3000)
```

**Examples:**
```bash
tsx examples/simple-chat.ts        # Chat example
tsx examples/direct-tool-call.ts   # Direct tool calls
open examples/web-integration.html # Web widget demo
```

The production Dockerfile includes Python packages (google-genai, openai, anthropic) and CLI tools (@google/gemini-cli, @anthropic-ai/claude-code) alongside the Node.js service.

## Environment Variables

Required in `.env` (see `env.example` or run `npm run setup`):
- `PORT`: Service port (default: 3000)
- `ANTHROPIC_API_KEY`: Claude API key (required)
- `ALLOWED_ORIGINS`: Comma-separated CORS origins
- `MCP_TYPE`: Connection type - `stdio` (subprocess) or `http` (REST API)
- `MCP_PATH`: Path to MCP server entrypoint (for stdio mode)
- `MCP_HTTP_URL`: MCP server URL (for http mode)
- `CLAUDE_MODEL`: Claude model to use (default: claude-sonnet-4-20250514)
- `MAX_TOKENS`: Max tokens per response (default: 1024)

## TypeScript Configuration

Uses strict mode with enhanced type safety:
- `noUncheckedIndexedAccess`: Requires index access null checks
- `exactOptionalPropertyTypes`: Distinguishes undefined vs missing properties
- `verbatimModuleSyntax`: Requires explicit type imports
- Module system: ES modules (`type: "module"` in package.json, `.js` imports in TypeScript files)

## Key Implementation Details

- Model used: Configurable via `CLAUDE_MODEL` env var (default: `claude-sonnet-4-20250514`)
- System prompt emphasizes being a Dutch tax advisor
- CORS configured from environment variable (comma-separated origins)
- Tool results passed back to Claude as `tool_result` content blocks
- The service expects conversational history to be managed by the client and passed in each request
- MCP bridge supports both stdio (JSON-RPC over stdin/stdout) and HTTP communication
- Tool execution happens in `executeToolLocally()` which calls `callMCPTool()` from mcp-bridge

## API Endpoints

**Chat endpoint:** `POST /api/chat`
- Accepts `{ message, history }`
- Returns Claude's response with automatic tool use

**Direct tool endpoint:** `POST /api/tools/:toolName`
- Call MCP tools directly with parameters
- Bypasses Claude, returns raw tool results
- Useful for programmatic integrations

## Client SDK

The repository includes `client-sdk.ts` and `client-sdk.js` for easy integration:

```typescript
import { TaxAdvisorClient } from './client-sdk';
const client = new TaxAdvisorClient('http://localhost:3000');
const response = await client.chat('What taxes do I owe?');
const toolResult = await client.callTool('get_tax_obligations', { year: 2024 });
```

Example integrations in `examples/` directory demonstrate:
- Simple chat conversations
- Direct tool calls
- Web widget embedding
