# Setup Command Output Example

This document shows what you'll see when running `npm run setup`.

## Setup Wizard Output

```
============================================================
Tax Advisor Service - Setup Wizard
============================================================

Please provide the following configuration:

Server port (default: 3000): 3000

Anthropic API Key:
Get your key from: https://console.anthropic.com/
ANTHROPIC_API_KEY: sk-ant-api03-...

CORS Configuration:
Enter allowed origins (comma-separated, or * for all)
ALLOWED_ORIGINS (default: *): http://localhost:3001,https://myapp.com

MCP Server Configuration:
This service connects to an external MCP server for tax tools.
Path to MCP server entry point (e.g., ../tax-advisor-mcp/dist/index.js): ../tax-advisor-mcp/dist/index.js

MCP Connection Type:
1. stdio (default - communicates via stdin/stdout)
2. http (REST API)
Select type (1/2, default: 1): 1

Claude Model Configuration:
Model (default: claude-sonnet-4-20250514):
Max tokens per response (default: 1024):

============================================================
✅ Setup complete! Configuration saved to .env
============================================================

Next steps:
1. Review your .env file
2. Start development server: npm run dev
3. Or build for production: npm run build && npm start

Service will be available at: http://localhost:3000

============================================================
📱 INTEGRATION OPTIONS
============================================================

🖥️  Option 1: Use with LLM Desktop Apps (Claude Desktop, etc.)
------------------------------------------------------------
You can use this service as an MCP server with Claude Desktop:

1. Start this service: npm run dev
2. Open your Claude Desktop config file:
   macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
   Windows: %APPDATA%\Claude\claude_desktop_config.json

3. Add this configuration:

   {
     "mcpServers": {
       "tax-advisor": {
         "command": "node",
         "args": ["/Users/you/projects/tax-advisor-service/dist/index.js"],
         "env": {
           "PORT": "3000",
           "ANTHROPIC_API_KEY": "sk-ant-api03-..."
         }
       }
     }
   }

4. Restart Claude Desktop
5. The tax advisor tools will be available in Claude!


🌐 Option 2: Integrate with Next.js Website
------------------------------------------------------------
Use the service in your Next.js application:

STEP 1: Install in your Next.js project
   cd your-nextjs-app
   npm install

STEP 2: Copy the client SDK
   cp /Users/you/projects/tax-advisor-service/client-sdk.ts src/lib/tax-advisor.ts

STEP 3: Create an API route (app/api/tax/route.ts):

   import { TaxAdvisorClient } from '@/lib/tax-advisor';
   import { NextRequest } from 'next/server';

   const client = new TaxAdvisorClient('http://localhost:3000');

   export async function POST(req: NextRequest) {
     const { message } = await req.json();

     try {
       const response = await client.chat(message);
       return Response.json(response);
     } catch (error) {
       return Response.json(
         { error: 'Failed to get response' },
         { status: 500 }
       );
     }
   }

STEP 4: Create a chat component (components/TaxChat.tsx):

   'use client';
   import { useState } from 'react';

   export default function TaxChat() {
     const [message, setMessage] = useState('');
     const [response, setResponse] = useState('');

     const sendMessage = async () => {
       const res = await fetch('/api/tax', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ message }),
       });
       const data = await res.json();
       // Extract text from response
       const text = data.response
         .filter(b => b.type === 'text')
         .map(b => b.text)
         .join('\\n');
       setResponse(text);
     };

     return (
       <div>
         <input
           value={message}
           onChange={(e) => setMessage(e.target.value)}
           placeholder="Ask about taxes..."
         />
         <button onClick={sendMessage}>Send</button>
         <div>{response}</div>
       </div>
     );
   }

STEP 5: Use in your page (app/page.tsx):

   import TaxChat from '@/components/TaxChat';

   export default function Home() {
     return <TaxChat />;
   }

STEP 6: Update CORS in .env to allow your Next.js app:
   ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000

STEP 7: Start both services:
   # Terminal 1 - Tax Advisor Service
   npm run dev

   # Terminal 2 - Next.js App
   cd your-nextjs-app && npm run dev


💡 Alternative: Use the HTML widget directly
------------------------------------------------------------
For a quick integration, copy examples/web-integration.html
into your Next.js public/ folder and customize it!

============================================================
📚 Documentation
============================================================
- Integration guide: INTEGRATION.md (detailed instructions!)
- Full examples: ./examples/
- API documentation: README.md
- Client SDK docs: client-sdk.ts

💡 TIP: Run 'cat INTEGRATION.md' to see full integration docs
============================================================
```

## What Gets Created

After running setup, you'll have:

1. **`.env` file** with all your configuration
2. **Integration instructions** showing how to:
   - Use with Claude Desktop
   - Integrate with Next.js
   - Use the standalone HTML widget

## Next Steps

Choose your integration path:

- **Claude Desktop**: Copy the config to `claude_desktop_config.json` and restart
- **Next.js**: Follow the steps shown to create API routes and components
- **Quick Test**: Open `examples/web-integration.html` in a browser

## Documentation Files

After setup, refer to:
- **QUICKSTART.md** - 5-minute quick start
- **INTEGRATION.md** - Detailed integration guides for all frameworks
- **README.md** - Complete API documentation
- **examples/** - Working code examples
