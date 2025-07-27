import Redis from "ioredis"
import logger from "../lib/logger"
import { REDIS_CONFIG } from "../config/redis.config"

const redis = new Redis({
  host: REDIS_CONFIG.host,
  port: REDIS_CONFIG.port,
  password: REDIS_CONFIG.password
})

export async function testRedisConnection() {
  try {
    await redis.ping()
    logger.info("✅ Redis connected successfully.")
  } catch (error) {
    logger.error("❌ Redis failed to connect:", error)
  }
}

export default redis
