import mongoose from "mongoose";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDb = async () => {
  if (!process.env.MONGODB_URL) {
    console.warn("MONGODB_URL is not configured; continuing without database connection");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log("DB Connected");
  } catch (error) {
    console.warn("MongoDB connection failed; continuing without database connection:", error.message);
  }
};

export default connectDb;