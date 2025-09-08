import bcryptjs from "bcryptjs"

import emailService from "./services/email.service"
import logger from "./lib/logger"

import { testPrismaConnection } from "./services/prisma.service"
import { testRedisConnection } from "./services/redis.service"
import { testMongooseConnection } from "./services/mongoose.service"
import { Server as HttpServer } from "http"

import socketIOService from "./services/socket.service"

export async function bootstrapApplication(httpServer: HttpServer): Promise<void> {
  try {
    logger.info("Starting application bootstrap process...")
    logger.info("Global error handlers registered.")

    socketIOService.init(httpServer)
    console.log(await bcryptjs.hash("0552320541", 10))

    //await emailService.init()
    await testPrismaConnection()
    // await testRedisConnection()
    // await testMongooseConnection()

    logger.info("✅ Application bootstrap complete. All services initialized and connections tested.")
  } catch (error) {
    logger.error("❌ Critical error during application bootstrap. Exiting process.", error)
    process.exit(1)
  }
}
