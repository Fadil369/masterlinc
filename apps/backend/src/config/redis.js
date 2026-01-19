import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redis.on("error", (err) => console.error("Redis Client Error", err));
redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("reconnecting", () => console.log("🔄 Redis reconnecting..."));

// Connect to Redis with error handling
let isConnected = false;

try {
  await redis.connect();
  isConnected = true;
} catch (err) {
  console.warn(
    "⚠️  Redis connection failed, some features will be unavailable:",
    err.message,
  );
  console.log(
    "💡 Tip: Start Redis with: docker-compose -f infrastructure/docker/docker-compose.yml up -d",
  );
}

// Export redis client with connection status
export default redis;
export { isConnected };
