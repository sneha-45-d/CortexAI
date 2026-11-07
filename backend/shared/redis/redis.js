import dotenv from "dotenv";
import Redis from "ioredis";

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
let hasLoggedRedisError = false;

const redis = new Redis(REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  connectTimeout: 2000,
  retryStrategy(times) {
    return times < 2 ? 200 : null;
  },
});

redis.on("connect", () => {
  hasLoggedRedisError = false;
  console.log("Redis connected");
});

redis.on("error", (error) => {
  if (!hasLoggedRedisError) {
    console.error("Redis connection error:", error.message);
    hasLoggedRedisError = true;
  }
});

export const redisHealthCheck = async () => {
  try {
    return (await redis.ping()) === "PONG";
  } catch {
    return false;
  }
};

export default redis;