# Tax Advisor Service

A REST API service that provides Dutch tax advisory capabilities powered by Claude AI. The service exposes tax-related tools through conversational AI, allowing users to ask tax questions, calculate estimates, and search regulations.

## Features

- **Conversational Tax Assistant**: Natural language interface for tax-related queries
- **Tool-Based Architecture**: Claude AI can call specialized tools to provide accurate information:
  - Get tax obligations for a specific year
  - Calculate tax liability estimates
  - View upcoming payment deadlines
  - Search Dutch tax law and regulations
  - Receive financial optimization advice
- **Stateless API**: Clients manage conversation history
- **Docker Support**: Production-ready containerization
- **CORS Enabled**: Configurable cross-origin access

## Prerequisites

- Node.js 20 or higher
- npm or yarn
- Anthropic API key (Claude access)

## Quick Start

**New to this project? See [QUICKSTART.md](QUICKSTART.md) for a 5-minute setup guide!**

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd tax-advisor-service
   npm install
   ```

2. **Run interactive setup:**
   ```bash
   npm run setup
   ```

   The setup wizard will guide you through configuration:
   - Server port
   - Anthropic API key (get one from https://console.anthropic.com/)
   - CORS allowed origins
   - MCP server path and connection type
   - Claude model and token settings

   **After setup completes, you'll see integration instructions for:**
   - Claude Desktop (LLM apps)
   - Next.js websites
   - Direct HTML/JavaScript usage

   Alternatively, manually create `.env` from `env.example`.

3. **Run in development mode:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Integration Guide

For detailed integration instructions, see **[INTEGRATION.md](INTEGRATION.md)**:

- **🖥️ Claude Desktop / LLM Apps**: Use as MCP server with Claude Desktop
- **🌐 Next.js**: Complete Next.js integration with code examples
- **⚛️ React**: React hooks and components
- **📄 Plain HTML/JS**: Standalone web widget
- **🎯 Other Frameworks**: Vue, Svelte, Angular examples

Quick integration options are also shown after running `npm run setup`.

## API Endpoints

### POST `/api/chat`

Send a message to the tax advisor assistant. Claude will automatically use tools when needed.

**Request Body:**
```json
{
  "message": "What taxes do I need to pay in 2024?",
  "history": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant",
      "content": [{"type": "text", "text": "Previous response"}]
    }
  ]
}
```

**Response:**
```json
{
  "response": [
    {
      "type": "text",
      "text": "Based on your query..."
    }
  ]
}
```

### POST `/api/tools/:toolName`

Call MCP tools directly with parameters, bypassing Claude.

**Available Tools:**
- `get_tax_obligations` - List taxes for a specific year
- `calculate_tax_estimate` - Estimate tax liability
- `get_upcoming_dues` - Show upcoming payment deadlines
- `search_dutch_tax_law` - Search Dutch tax regulations
- `get_spending_advice` - Get financial optimization tips

**Request Body:**
```json
{
  "year": 2024,
  "income": 50000,
  "deductions": 5000
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "estimated_tax": 12500,
    "effective_rate": 25
  }
}
```

### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Usage Examples

### Using cURL

**Chat with the assistant:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the income tax rate for 2024?"
  }'
```

**Call a tool directly:**
```bash
curl -X POST http://localhost:3000/api/tools/calculate_tax_estimate \
  -H "Content-Type: application/json" \
  -d '{
    "income": 50000,
    "deductions": 5000
  }'
```

### Using the Client SDK

The service includes a TypeScript/JavaScript SDK for easy integration:

```typescript
import { TaxAdvisorClient, extractText } from './client-sdk';

const client = new TaxAdvisorClient('http://localhost:3000');

// Chat with the assistant
const response = await client.chat('What taxes do I need to pay?');
console.log(extractText(response));

// Call a tool directly
const estimate = await client.callTool('calculate_tax_estimate', {
  income: 50000,
  deductions: 5000
});
console.log(estimate);
```

### Embedding in a Web Application

See `examples/web-integration.html` for a complete chat widget example. Simply open the HTML file in a browser (make sure the service is running):

```bash
npm run dev
# In another terminal or browser:
open examples/web-integration.html
```

### Running Examples

```bash
# Simple chat example
tsx examples/simple-chat.ts

# Direct tool call example
tsx examples/direct-tool-call.ts
```

## Development

**Run with hot reload:**
```bash
npm run dev
```

**Type checking:**
```bash
npm run build
```

The service uses TypeScript with strict type checking enabled. All source files are in `src/` and compile to `dist/`.

## Docker Deployment

**Using Docker Compose:**
```bash
docker-compose up
```

Service will be available at `http://localhost:3029`

**Manual Docker build:**
```bash
# Build
npm run build
docker build -t tax-advisor-service .

# Run
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=your-key \
  tax-advisor-service
```

## Project Structure

```
tax-advisor-service/
├── src/
│   ├── index.ts          # Express server setup
│   ├── routes.ts         # Chat endpoint and tool definitions
│   └── mcp-bridge.ts     # MCP server integration (stub)
├── dist/                 # Compiled JavaScript (generated)
├── Dockerfile            # Production container
├── docker-compose.yml    # Development container setup
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## Technology Stack

- **Runtime**: Node.js 20
- **Framework**: Express 5
- **AI**: Anthropic Claude (claude-sonnet-4-20250514)
- **Language**: TypeScript 5 with strict mode
- **Development**: tsx for hot reload

## Architecture Notes

The service acts as a bridge between HTTP clients and Claude AI:

1. Client sends a message (with optional conversation history)
2. Service forwards to Claude with available tools
3. If Claude needs tool data, service calls the MCP server via stdio or HTTP
4. Tool result is sent back to Claude for final response
5. Final response returned to client

**MCP Integration**: The service connects to an external MCP server that implements the actual tax tools. It supports both stdio (subprocess) and HTTP connection modes.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `ANTHROPIC_API_KEY` | Claude API key | Required |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | * |
| `MCP_TYPE` | MCP connection type: `stdio` or `http` | stdio |
| `MCP_PATH` | Path to MCP server (for stdio mode) | ../tax-advisor-mcp/dist/index.js |
| `MCP_HTTP_URL` | MCP server URL (for http mode) | - |
| `CLAUDE_MODEL` | Claude model to use | claude-sonnet-4-20250514 |
| `MAX_TOKENS` | Max tokens per response | 1024 |

Run `npm run setup` for an interactive configuration wizard.

## License

ISC
