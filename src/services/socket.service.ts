import { Server as SocketIOServer, Socket } from "socket.io"
import { Server as HttpServer } from "http"
import logger from "../lib/logger"
import ChatsSocketController from "../controllers/socket/chats.socket.controller"
import RequestsSocketController from "../controllers/socket/request.socket.controller"

class SocketIOService {
  private io: SocketIOServer | null = null

  public init(server: HttpServer): void {
    if (this.io) {
      logger.warn("Socket.IO server already initialized.")
      return
    }

    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })

    logger.info("✅ Socket.IO server initialized.")

    this.io.on("connection", (socket) => {
      try {
        ChatsSocketController.handleConnection(socket, this.io!)
        RequestsSocketController.handleConnection(socket, this.io!)
      } catch (err) {
        console.error("SocketController error:", err)
      }
    })
    this.io.on("error", (error) => this.handleServerError(error))

    this.io.on("connection", (socket) => this.handleConnection(socket))
    this.io.on("error", (error) => this.handleServerError(error))
  }

  private handleConnection(socket: Socket): void {
    logger.info(`New Socket.IO client connected: ${socket.id} from ${socket.handshake.address}`)

    socket.on("disconnect", (reason: string) => this.handleDisconnect(socket, reason))
    socket.on("error", (error: Error) => this.handleClientError(socket, error))

    socket.emit("welcome", `Welcome, ${socket.id}! You are connected to the chat.`)

    socket.broadcast.emit("userJoined", `User ${socket.id} has joined the chat.`)
  }

  private handleDisconnect(socket: Socket, reason: string): void {
    logger.info(`Socket.IO client disconnected: ${socket.id}, Reason: ${reason}`)
    socket.broadcast.emit("userLeft", `User ${socket.id} has left the chat.`)
  }

  private handleClientError(socket: Socket, error: Error): void {
    logger.error(`Socket.IO client error on ${socket.id}: ${error.message}`, error)
  }

  private handleServerError(error: Error): void {
    logger.error(`❌ Socket.IO server error: ${error.message}`, error)
  }

  public emitToAll(eventName: string, data: any): void {
    if (!this.io) {
      logger.error("Socket.IO server not initialized, cannot emit to all.")
      return
    }
    this.io.emit(eventName, data)
    logger.debug(`Emitted event '${eventName}' to all clients with data:`, data)
  }

  public shutdown(): void {
    if (this.io) {
      this.io.close(() => {
        logger.info("Socket.IO server gracefully shut down.")
      })
      this.io = null
    }
  }
}

const socketIOService = new SocketIOService()
export default socketIOService
