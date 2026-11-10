
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import router from "./routes/agent.route.js";

dotenv.config();

const port = Number(process.env.PORT || process.env.port) || 8003;

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(express.json({ limit: "20mb" }));
app.use("/",router)

app.get("/", (req, res) => {
  res.json({ message: "hello from agent" });
});

const startServer = () => {
  const server = app.listen(port, () => {
    console.log(`agent is running on port ${port}`);
  });

  server.on("error", (error) => {
    console.error(`Agent Service failed to start on port ${port}:`, error.message);
    if (error.code === "EADDRINUSE") {
      console.warn("Port is already in use. Service remains running with the current process, but requests may not be served on this port.");
    }
  });

  void connectDb();
};

startServer();

process.on("uncaughtException", (error) => {
  console.error("Unhandled exception in agent service:", error.message);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection in agent service:", reason instanceof Error ? reason.message : reason);
});