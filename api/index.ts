import services from "../src/services/register"
import express from "express"
import logger from "../src/lib/logger"
import router from "../src/routes"
import dotenv from "dotenv"
import path from "path"

import { Request, Response } from "express"
import { NotFoundError } from "../src/errors"
import { CONFIG } from "../src/config"

import { assignAdmin, assignUser } from "../src/middleware/auth.middleware"
import { bootstrapApplication } from "../src/bootstrap"
import { errorHandler } from "../src/middleware/error-handler.middleware"
import { createServer } from "http"
import { json } from "../src/lib/helpers"

dotenv.config()

const app = express()
const port = CONFIG.appPort

const httpServer = createServer(app)

bootstrapApplication(httpServer)
  .then(() => {
    app.use(services)
    app.use(express.json())

    app.use("/api", router)
    app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")))

    app.use(assignUser)
    app.use(assignAdmin)

    app.get("/", (_: Request, res: Response) => {
      return json({
        res,
        message: "Welcome to the API!",
        status: 200
      })
    })

    app.use((req: Request, res: Response) => {
      throw new NotFoundError(`The requested URL ${req.url} was not found on this server.`)
    })

    app.use(errorHandler)

    httpServer.listen(port, () => {
      logger.info(`✅ Server is running on http://localhost:${port}`)
    })
  })
  .catch((error) => {
    logger.error("❌ Failed to bootstrap application:", error)
    process.exit(1)
  })
