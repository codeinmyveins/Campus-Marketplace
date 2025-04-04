require("dotenv").config();
const Redis = require("ioredis");

const redis = new Redis({
    host: "127.0.0.1",
    port: process.env.REDIS_PORT || "6379", // default port
    maxRetriesPerRequest: null,
});

redis.on("error", (err) => console.error("❌ Redis Error:", err));
redis.on("connect", () => console.log("✅ Connected to Redis"));

module.exports = redis;
