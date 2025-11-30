import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { chatRoute } from "./routes.js";
config();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") || "*" }));
app.use(express.json());
app.get("/health", (_, res) => res.json({ status: "ok" }));
app.post("/api/chat", chatRoute);
app.listen(PORT, () => console.log(`Service running on port ${PORT}`));
//# sourceMappingURL=index.js.map