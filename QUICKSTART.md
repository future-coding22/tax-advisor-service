# Quick Start Guide

Get up and running in 5 minutes.

## Setup

```bash
npm install
npm run setup  # Interactive wizard
npm run dev    # Start service on http://localhost:3000
```

## Test It Works

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What taxes do I need to pay?"}'
```

## Use with Claude Desktop

**1. Build the service:**
```bash
npm run build
```

**2. Add to `claude_desktop_config.json`:**

macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "tax-advisor": {
      "command": "node",
      "args": ["/full/path/to/tax-advisor-service/dist/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-your-key"
      }
    }
  }
}
```

**3. Restart Claude Desktop** - Done! Tools available in Claude.

## Use in Next.js

**1. Copy SDK:**
```bash
cp client-sdk.ts your-nextjs-app/src/lib/tax-advisor.ts
```

**2. Create API route** (`app/api/tax/route.ts`):
```typescript
import { TaxAdvisorClient } from '@/lib/tax-advisor';

const client = new TaxAdvisorClient('http://localhost:3000');

export async function POST(req: Request) {
  const { message } = await req.json();
  const response = await client.chat(message);
  return Response.json(response);
}
```

**3. Use in component:**
```tsx
'use client';
import { useState } from 'react';

export default function TaxChat() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');

  const ask = async () => {
    const res = await fetch('/api/tax', {
      method: 'POST',
      body: JSON.stringify({ message }),
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    setResponse(data.response[0]?.text || '');
  };

  return (
    <div>
      <input value={message} onChange={e => setMessage(e.target.value)} />
      <button onClick={ask}>Ask</button>
      <p>{response}</p>
    </div>
  );
}
```

**4. Update CORS in tax-advisor `.env`:**
```bash
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000
```

## Use Standalone HTML

Just open `examples/web-integration.html` in your browser!

```bash
npm run dev  # Start service
open examples/web-integration.html  # Open widget
```

## Direct Tool Calls (No Claude)

Call MCP tools directly:

```bash
curl -X POST http://localhost:3000/api/tools/calculate_tax_estimate \
  -H "Content-Type: application/json" \
  -d '{"income": 50000, "deductions": 5000}'
```

Or using the SDK:
```typescript
import { TaxAdvisorClient } from './client-sdk';

const client = new TaxAdvisorClient('http://localhost:3000');
const result = await client.callTool('calculate_tax_estimate', {
  income: 50000,
  deductions: 5000
});
```

## Available Tools

1. `get_tax_obligations` - List taxes for a year
2. `calculate_tax_estimate` - Estimate tax liability
3. `get_upcoming_dues` - Payment deadlines
4. `search_dutch_tax_law` - Search regulations
5. `get_spending_advice` - Financial tips

## Next Steps

- See **[INTEGRATION.md](INTEGRATION.md)** for detailed integration guides
- Check **[examples/](examples/)** for complete code examples
- Read **[README.md](README.md)** for full API documentation
