# Integration Guide

This guide shows how to integrate the Tax Advisor Service into various applications.

## Table of Contents
- [Claude Desktop (LLM Desktop Apps)](#claude-desktop-llm-desktop-apps)
- [Next.js Website](#nextjs-website)
- [React Applications](#react-applications)
- [Plain JavaScript/HTML](#plain-javascripthtml)
- [Other Frameworks](#other-frameworks)

---

## Claude Desktop (LLM Desktop Apps)

Integrate this service as an MCP server with Claude Desktop or other LLM desktop applications.

### Prerequisites
- Tax Advisor Service built: `npm run build`
- Claude Desktop installed

### Setup Steps

**1. Build the service:**
```bash
npm run build
```

**2. Locate your Claude Desktop config file:**
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

**3. Edit the config file and add this service:**
```json
{
  "mcpServers": {
    "tax-advisor": {
      "command": "node",
      "args": ["/absolute/path/to/tax-advisor-service/dist/index.js"],
      "env": {
        "PORT": "3000",
        "ANTHROPIC_API_KEY": "your-api-key-here",
        "MCP_PATH": "/path/to/your/mcp-server/dist/index.js"
      }
    }
  }
}
```

**4. Replace placeholders:**
- Replace `/absolute/path/to/tax-advisor-service` with your actual path
- Replace `your-api-key-here` with your Anthropic API key
- Replace `/path/to/your/mcp-server` with your MCP server path

**5. Restart Claude Desktop**

**6. Verify integration:**
- Open Claude Desktop
- Ask: "What tax tools do you have available?"
- Claude should see: `get_tax_obligations`, `calculate_tax_estimate`, `get_upcoming_dues`, `search_dutch_tax_law`, `get_spending_advice`

### Troubleshooting
- Check Claude Desktop logs: `~/Library/Logs/Claude/` (macOS)
- Ensure paths are absolute, not relative
- Verify the service builds successfully: `npm run build`
- Test the service standalone first: `npm run dev`

---

## Next.js Website

Integrate the Tax Advisor Service into a Next.js application.

### Quick Start

**1. Copy the Client SDK to your Next.js project:**
```bash
# From your Next.js project root
cp /path/to/tax-advisor-service/client-sdk.ts src/lib/tax-advisor.ts
```

**2. Create an API route** (`app/api/tax/route.ts`):
```typescript
import { TaxAdvisorClient } from '@/lib/tax-advisor';
import { NextRequest } from 'next/server';

const client = new TaxAdvisorClient(
  process.env.TAX_ADVISOR_URL || 'http://localhost:3000'
);

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();
    const response = await client.chat(message, { customHistory: history });
    return Response.json(response);
  } catch (error) {
    console.error('Tax advisor error:', error);
    return Response.json(
      { error: 'Failed to get response' },
      { status: 500 }
    );
  }
}
```

**3. Create a chat component** (`components/TaxChat.tsx`):
```tsx
'use client';
import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function TaxChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      // Extract text from Claude's response
      const text = data.response
        ?.filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join('\n') || 'No response';

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: text }
      ]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Error: Failed to get response' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg ${
              msg.role === 'user'
                ? 'bg-blue-100 ml-auto max-w-[80%]'
                : 'bg-gray-100 mr-auto max-w-[80%]'
            }`}
          >
            <div className="font-semibold mb-1">
              {msg.role === 'user' ? 'You' : 'Tax Advisor'}
            </div>
            <div className="whitespace-pre-wrap">{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div className="bg-gray-100 p-4 rounded-lg mr-auto max-w-[80%]">
            Thinking...
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask about taxes..."
          className="flex-1 p-3 border rounded-lg"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
        >
          Send
        </button>
      </div>
    </div>
  );
}
```

**4. Use in your page** (`app/page.tsx`):
```tsx
import TaxChat from '@/components/TaxChat';

export default function Home() {
  return (
    <main>
      <h1 className="text-3xl font-bold text-center my-8">
        Dutch Tax Advisor
      </h1>
      <TaxChat />
    </main>
  );
}
```

**5. Configure environment variables** (`.env.local`):
```bash
TAX_ADVISOR_URL=http://localhost:3000
```

**6. Update Tax Advisor Service CORS** (in tax-advisor-service `.env`):
```bash
ALLOWED_ORIGINS=http://localhost:3001,https://yourdomain.com
```

**7. Start both services:**
```bash
# Terminal 1 - Tax Advisor Service
cd tax-advisor-service
npm run dev

# Terminal 2 - Next.js App
cd your-nextjs-app
npm run dev
```

### Advanced: Server-Side Direct Integration

For server-side rendering or API routes that call tools directly:

```typescript
// app/api/tax-estimate/route.ts
import { TaxAdvisorClient } from '@/lib/tax-advisor';

export async function POST(req: Request) {
  const { income, deductions } = await req.json();

  const client = new TaxAdvisorClient(process.env.TAX_ADVISOR_URL!);

  try {
    const result = await client.callTool('calculate_tax_estimate', {
      income,
      deductions
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: 'Failed to calculate' }, { status: 500 });
  }
}
```

---

## React Applications

For Create React App, Vite, or other React setups:

**1. Copy the JavaScript SDK:**
```bash
cp /path/to/tax-advisor-service/client-sdk.js src/lib/tax-advisor.js
```

**2. Create a chat hook:**
```javascript
// src/hooks/useTaxChat.js
import { useState } from 'react';
import { TaxAdvisorClient } from '../lib/tax-advisor';

const client = new TaxAdvisorClient('http://localhost:3000');

export function useTaxChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (message) => {
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setLoading(true);

    try {
      const response = await client.chat(message);
      const text = response.response
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('\n');

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: text }
      ]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, sendMessage };
}
```

**3. Use in component:**
```javascript
import { useTaxChat } from './hooks/useTaxChat';

function App() {
  const { messages, loading, sendMessage } = useTaxChat();
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <div>
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role}>
            {msg.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          Send
        </button>
      </form>
    </div>
  );
}
```

---

## Plain JavaScript/HTML

For simple HTML pages or static sites:

**1. Use the example widget:**
```bash
cp examples/web-integration.html public/tax-chat.html
```

**2. Or create your own:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Tax Advisor</title>
</head>
<body>
  <div id="chat"></div>
  <input id="input" type="text" placeholder="Ask about taxes...">
  <button onclick="send()">Send</button>

  <script type="module">
    const API_URL = 'http://localhost:3000';

    async function send() {
      const input = document.getElementById('input');
      const message = input.value;
      input.value = '';

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      const text = data.response
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('\n');

      document.getElementById('chat').innerHTML +=
        `<div><strong>You:</strong> ${message}</div>
         <div><strong>Assistant:</strong> ${text}</div>`;
    }

    window.send = send;
  </script>
</body>
</html>
```

---

## Other Frameworks

### Vue.js
```javascript
// composables/useTaxAdvisor.js
import { ref } from 'vue';
import { TaxAdvisorClient } from '@/lib/tax-advisor';

export function useTaxAdvisor() {
  const client = new TaxAdvisorClient('http://localhost:3000');
  const messages = ref([]);

  const chat = async (message) => {
    const response = await client.chat(message);
    return response;
  };

  return { chat, messages };
}
```

### Svelte
```svelte
<script>
  import { TaxAdvisorClient } from '$lib/tax-advisor';

  let client = new TaxAdvisorClient('http://localhost:3000');
  let message = '';
  let response = '';

  async function sendMessage() {
    const res = await client.chat(message);
    response = res.response
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');
  }
</script>

<input bind:value={message} />
<button on:click={sendMessage}>Send</button>
<div>{response}</div>
```

### Angular
```typescript
// services/tax-advisor.service.ts
import { Injectable } from '@angular/core';
import { TaxAdvisorClient } from './tax-advisor';

@Injectable({ providedIn: 'root' })
export class TaxAdvisorService {
  private client = new TaxAdvisorClient('http://localhost:3000');

  async chat(message: string) {
    return this.client.chat(message);
  }

  async callTool(toolName: string, params: any) {
    return this.client.callTool(toolName, params);
  }
}
```

---

## Production Deployment

### Environment Variables
Set these in your production environment:
```bash
TAX_ADVISOR_URL=https://api.yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Docker Deployment
```bash
# Build and run
docker build -t tax-advisor .
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=your-key \
  -e ALLOWED_ORIGINS=https://yourdomain.com \
  tax-advisor
```

### HTTPS Considerations
- Use a reverse proxy (nginx, Caddy) for HTTPS
- Update CORS to allow your HTTPS domain
- Update client SDK URLs to use HTTPS

---

## Support

For more examples, see the `examples/` directory:
- `examples/simple-chat.ts` - Basic chat
- `examples/direct-tool-call.ts` - Tool calling
- `examples/web-integration.html` - Complete web widget
