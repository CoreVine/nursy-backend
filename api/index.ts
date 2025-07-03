import dotenv from "dotenv"
import express, { Request, Response } from "express"
import path from "path"
import error from "../middleware/error-handler.middleware"
import router from "../services/router.service"
import services from "../services/register"
import logger from "../lib/logger"
import emailService from "../services/email.service"

import { CONFIG } from "../config"
import { NotFoundError } from "../errors"

import { testPrismaConnection } from "../services/prisma.service"
import { testRedisConnection } from "../services/redis.service"
import { assignUser } from "../middleware/auth.middleware"

dotenv.config()

emailService.init()
error.handleUnhandledRejection()
error.handleUncaughtException()

const app = express()
const port = CONFIG.PORT

testPrismaConnection()
testRedisConnection()

app.use(express.json())
app.use(services)

app.use(assignUser)

app.use("/api", router)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")))

app.get("/", (req: Request, res: Response) => {
  return res.status(200).json({
    message: "Welcome to the API",
    data: req.user
  })
})

app.use((req: Request, res: Response) => {
  throw new NotFoundError(`The requested URL ${req.url} was not found on this server.`)
})

app.use(error.errorHandler)

app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`)
})
