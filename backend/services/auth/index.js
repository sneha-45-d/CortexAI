import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import router from "./routes/auth.route.js";

dotenv.config();
const port = Number(process.env.PORT) || 8001;

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());
app.use("/", router);

app.get("/", (req, res) => {
  res.json({ message: "hello from auth" });
});

const startServer = () => {
  const server = app.listen(port, () => {
    console.log(`Auth Service is running on port ${port}`);
  });

  server.on("error", (error) => {
    console.error(`Auth Service failed to start on port ${port}:`, error.message);
    if (error.code === "EADDRINUSE") {
      console.warn("Port is already in use. Service remains running with the current process, but requests may not be served on this port.");
    }
  });

  void connectDb();
};

startServer();

process.on("uncaughtException", (error) => {
  console.error("Unhandled exception in auth service:", error.message);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection in auth service:", reason instanceof Error ? reason.message : reason);
});