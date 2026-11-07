import express from "express";
import dotenv from "dotenv";
import proxy from "express-http-proxy";
import cors from "cors";
import morgan from "morgan";
import { protect } from "./middleware/auth.middleware.js";
import { proxyWithHeader } from "./utils/proxyWithHeader.js";

dotenv.config();

const port = Number(process.env.PORT) || 8000;
const authServiceUrl = process.env.AUTH_SERVICE || "http://localhost:8001";
const chatServiceUrl = process.env.CHAT_SERVICE || "http://localhost:8002";
const agentServiceUrl = process.env.AGENT_SERVICE || "http://localhost:8003";
const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);
app.use(morgan("combined"));
app.use(express.json());

app.use(
  "/api/auth",
  proxy(authServiceUrl, {
    proxyReqPathResolver: (req) => {
      const path = req.originalUrl.replace(/^\/api\/auth/, "") || "/";
      return path;
    },
  })
);

const getCurrentUser = (req, res) => {
  return res.status(200).json({ user: req.user ?? null });
};

app.get("/api/me", protect, getCurrentUser);
app.use("/api/chat", protect, proxyWithHeader(chatServiceUrl));
app.use("/api/agent", protect, proxy(agentServiceUrl));

app.get("/", (req, res) => {
  res.json({ message: "hello from gateway" });
});

const server = app.listen(port, () => {
  console.log(`Gateway server is running on port ${port}`);
});

server.on("error", (error) => {
  console.error(`Gateway failed to start on port ${port}:`, error.message);
  if (error.code === "EADDRINUSE") {
    console.warn("Port is already in use. Gateway remains alive but may not accept requests on this port.");
  }
});

process.on("uncaughtException", (error) => {
  console.error("Unhandled exception in gateway:", error.message);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection in gateway:", reason instanceof Error ? reason.message : reason);
});