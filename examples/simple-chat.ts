/**
 * Simple chat example using the Tax Advisor Client SDK
 *
 * Run with: tsx examples/simple-chat.ts
 */

import { TaxAdvisorClient, extractText } from "../client-sdk.js";

async function main() {
  const client = new TaxAdvisorClient("http://localhost:3000");

  console.log("Tax Advisor Chat Example");
  console.log("=".repeat(50));

  // Check health
  const healthy = await client.healthCheck();
  if (!healthy) {
    console.error("Service is not healthy!");
    process.exit(1);
  }

  console.log("✓ Service is healthy\n");

  // Example conversation
  console.log("User: What taxes do I need to pay in the Netherlands?\n");
  const response1 = await client.chat("What taxes do I need to pay in the Netherlands?");
  console.log("Assistant:", extractText(response1), "\n");

  console.log("User: Can you estimate my tax for 50000 euros income?\n");
  const response2 = await client.chat("Can you estimate my tax for 50000 euros income?");
  console.log("Assistant:", extractText(response2), "\n");

  // Show history
  console.log("=".repeat(50));
  console.log("Conversation History:");
  console.log(JSON.stringify(client.getHistory(), null, 2));
}

main().catch(console.error);
