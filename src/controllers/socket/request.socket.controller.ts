import { Socket, Server as SocketIOServer } from "socket.io"
import { BaseSocketController } from "./base.socket.controller"
import { UnauthorizedError } from "../../errors"
import { Decimal } from "@prisma/client/runtime/library"

import logger from "../../lib/logger"
import db from "../../services/prisma.service"
import { errorHandler } from "../../middleware/error-handler.middleware"

class RequestsSocketController extends BaseSocketController {
  static async handleConnection(socket: Socket, io: SocketIOServer) {
    logger.info(`[RequestsSocketController]: Client connected: ${socket.id}`)
    socket.on("fetchRequestsForNurse", () => RequestsSocketController.fetchAllRequetsForNurse(socket))
  }

  static async fetchAllRequetsForNurse(socket: Socket) {
    const payload = await this.getUserFromSocket(socket)
    const nurse = await db.user.findUnique({ where: { id: payload.id } })

    if (!nurse) throw new Error("Failed to get nurse!")

    const requests = await db.order.findMany({
      include: { user: true }
    })

    return requests
  }
}

export default RequestsSocketController
