import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { chatRoute, toolRoute } from "./routes.js";
import { initMCP } from "./mcp-bridge.js";

config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") || "*" }));
app.use(express.json());

app.get("/health", (_, res) => res.json({ status: "ok" }));
app.post("/api/chat", chatRoute);
app.post("/api/tools/:toolName", toolRoute);

// Initialize MCP bridge
async function startServer() {
  try {
    await initMCP();
    console.log("MCP Bridge initialized");
  } catch (error) {
    console.error("Failed to initialize MCP:", error);
    console.warn("Service will run without MCP integration");
  }

  app.listen(PORT, () => console.log(`Service running on port ${PORT}`));
}

startServer();
