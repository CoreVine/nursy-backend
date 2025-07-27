import { PrismaClient } from "@prisma/client"
import logger from "../lib/logger"

const db = new PrismaClient()

export async function testPrismaConnection() {
  try {
    await db.$connect()
    logger.info("✅ Prisma connected successfully.")
  } catch (error) {
    logger.error("❌ Prisma failed to connect:", error)
  }
}

export default db
