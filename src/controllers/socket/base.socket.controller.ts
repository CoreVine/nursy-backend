import { Socket } from "socket.io"
import { JwtPayload } from "../../types"
import jwtService from "../../services/jwt.service"

export class BaseSocketController {
  static async getUserFromSocket(socket: Socket): Promise<JwtPayload> {
    const header = socket.handshake.auth.token || socket.handshake.headers.authorization || socket.handshake.query.token
    if (!header) throw new Error("Authorization token missing.")
    return jwtService.verifyToken(header)
  }
}
