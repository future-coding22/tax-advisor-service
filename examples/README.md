# Examples

This directory contains examples showing different ways to integrate the Tax Advisor Service.

## Quick Start

Make sure the service is running first:

```bash
cd ..
npm run setup  # If you haven't configured yet
npm run dev    # Start the service
```

## Available Examples

### 1. Simple Chat (TypeScript)

`simple-chat.ts` - Basic conversation example with conversation history

```bash
tsx examples/simple-chat.ts
```

### 2. Direct Tool Calls (TypeScript)

`direct-tool-call.ts` - Call MCP tools directly without Claude

```bash
tsx examples/direct-tool-call.ts
```

### 3. Web Integration (HTML)

`web-integration.html` - Complete chat widget for embedding in web applications

```bash
# Just open in a browser (with service running)
open examples/web-integration.html
# or
firefox examples/web-integration.html
```

## Creating Your Own Integration

### TypeScript/Node.js

```typescript
import { TaxAdvisorClient, extractText } from '../client-sdk';

const client = new TaxAdvisorClient('http://localhost:3000');

// Conversational chat
const response = await client.chat('What is my tax obligation?');
console.log(extractText(response));

// Direct tool call
const result = await client.callTool('calculate_tax_estimate', {
  income: 50000,
  deductions: 5000
});
console.log(result);
```

### JavaScript/Browser

```javascript
import { TaxAdvisorClient } from '../client-sdk.js';

const client = new TaxAdvisorClient('http://localhost:3000');
const response = await client.chat('Help me with my taxes');
console.log(response);
```

### Plain HTTP (any language)

```bash
# Chat endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What taxes do I owe?"}'

# Direct tool endpoint
curl -X POST http://localhost:3000/api/tools/get_tax_obligations \
  -H "Content-Type: application/json" \
  -d '{"year": 2024}'
```

## Notes

- The web integration example demonstrates a complete chat UI
- TypeScript examples use the SDK for cleaner code
- All examples require the service to be running
- CORS is configured via `ALLOWED_ORIGINS` in `.env`
