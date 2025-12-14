/**
 * Direct tool call example
 *
 * Demonstrates how to call MCP tools directly without going through Claude
 *
 * Run with: tsx examples/direct-tool-call.ts
 */

import { TaxAdvisorClient } from "../client-sdk.js";

async function main() {
  const client = new TaxAdvisorClient("http://localhost:3000");

  console.log("Direct Tool Call Example");
  console.log("=".repeat(50));

  try {
    // Call get_tax_obligations directly
    console.log("\n1. Getting tax obligations for 2024...");
    const obligations = await client.callTool("get_tax_obligations", { year: 2024 });
    console.log("Result:", JSON.stringify(obligations, null, 2));

    // Call calculate_tax_estimate directly
    console.log("\n2. Calculating tax estimate...");
    const estimate = await client.callTool("calculate_tax_estimate", {
      income: 50000,
      deductions: 5000,
    });
    console.log("Result:", JSON.stringify(estimate, null, 2));

    // Call get_upcoming_dues directly
    console.log("\n3. Getting upcoming payment deadlines...");
    const dues = await client.callTool("get_upcoming_dues", { days_ahead: 60 });
    console.log("Result:", JSON.stringify(dues, null, 2));

    // Call search_dutch_tax_law directly
    console.log("\n4. Searching Dutch tax law...");
    const lawInfo = await client.callTool("search_dutch_tax_law", {
      query: "income tax rates 2024",
    });
    console.log("Result:", JSON.stringify(lawInfo, null, 2));

    // Call get_spending_advice directly
    console.log("\n5. Getting spending advice...");
    const advice = await client.callTool("get_spending_advice", {
      focus: "tax optimization",
    });
    console.log("Result:", JSON.stringify(advice, null, 2));
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
  }
}

main().catch(console.error);
