import jwtService from "../../services/jwt.service"
import logger from "../../lib/logger"

import { JwtPayload } from "../../types"
import { Socket } from "socket.io"

export class BaseSocketController {
  static async getUserFromSocket(socket: Socket): Promise<JwtPayload> {
    const header = socket.handshake.auth.token || socket.handshake.headers.authorization || socket.handshake.query.token
    logger.info(`[BaseSocketController]: Extracted token from socket: ${header}`)
    if (!header) throw new Error("Authorization token missing.")
    return jwtService.verifyToken(header)
  }
}
