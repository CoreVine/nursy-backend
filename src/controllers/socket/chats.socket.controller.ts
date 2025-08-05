import { BaseSocketController } from "./base.socket.controller"
import { Socket, Server as SocketIOServer } from "socket.io"

import logger from "../../lib/logger"
import db from "../../services/prisma.service"

interface JoinChatPayload {
  chatId: number
}
interface LeaveChatPayload {
  chatId: number
}

interface SendMessagePayload {
  chatId: number
  content: string
  attachment?: string
}

class ChatsSocketController extends BaseSocketController {
  static handleConnection(socket: Socket, io: SocketIOServer) {
    logger.info(`[ChatsSocketController]: Client connected: ${socket.id}`)

    socket.on("joinChat", (payload: JoinChatPayload) => ChatsSocketController.handleJoinChat(socket, payload))
    socket.on("leaveChat", (payload: LeaveChatPayload) => ChatsSocketController.handleLeaveChat(socket, payload))
    socket.on("sendMessage", (payload: SendMessagePayload) => ChatsSocketController.handleSendMessage(socket, io, payload))

    socket.on("disconnect", (reason: string) => {
      logger.info(`Socket.IO client disconnected: ${socket.id}, Reason: ${reason}`)
    })

    socket.on("error", (error: Error) => {
      logger.error(`Socket.IO client error on ${socket.id}: ${error.message}`, error)
    })

    socket.emit("welcome", `Welcome, ${socket.id}! You are connected to the chat.`)
  }

  static async authorizeChatAccess(userId: number, chatId: number) {
    const chat = await db.chat.findUnique({
      where: { id: Number(chatId) },
      select: { userId: true, nurseId: true }
    })
    if (!chat) throw new Error("Chat not found")
    if (chat.userId != userId && chat.nurseId != userId) throw new Error("You are not authorized to access this chat.")
    return chat
  }

  static async handleJoinChat(socket: Socket, payload: JoinChatPayload) {
    try {
      const user = await ChatsSocketController.getUserFromSocket(socket)
      await ChatsSocketController.authorizeChatAccess(user.id, payload.chatId)

      socket.join(`chat_${payload.chatId}`)
      logger.info(`Socket ${socket.id} (user ${user.id}) joined chat_${payload.chatId}`)
      socket.to(`chat_${payload.chatId}`).emit("userJoined", { userId: user.id, chatId: payload.chatId })
      socket.emit("joinedChat", { chatId: payload.chatId, userId: user.id })
    } catch (error: any) {
      logger.warn(`joinChat error: ${error.message}`)
      socket.emit("error", { message: error.message || "Failed to join chat" })
    }
  }

  static async handleLeaveChat(socket: Socket, payload: LeaveChatPayload) {
    try {
      const user = await ChatsSocketController.getUserFromSocket(socket)
      await ChatsSocketController.authorizeChatAccess(user.id, payload.chatId)

      socket.leave(`chat_${payload.chatId}`)
      logger.info(`Socket ${socket.id} (user ${user.id}) left chat_${payload.chatId}`)
      socket.to(`chat_${payload.chatId}`).emit("userLeft", { userId: user.id, chatId: payload.chatId })
      socket.emit("leaveChat", { chatId: payload.chatId, userId: user.id })
    } catch (error: any) {
      logger.warn(`leaveChat error: ${error.message}`)
      socket.emit("error", { message: error.message || "Failed to leave chat" })
    }
  }

  static async handleSendMessage(socket: Socket, io: SocketIOServer, payload: SendMessagePayload) {
    try {
      const user = await ChatsSocketController.getUserFromSocket(socket)
      await ChatsSocketController.authorizeChatAccess(user.id, payload.chatId)

      const message = await db.message.create({
        data: {
          chatId: Number(payload.chatId),
          senderId: Number(user.id),
          content: payload.content,
          attachment: payload.attachment
        },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              phoneNumber: true,
              username: true,
              isVerified: true
            }
          }
        }
      })
      if (!message) {
        throw new Error("Failed to create message")
      }
      logger.info(`(user ${user.id}) sent message in chat_${payload.chatId}`)
      io.to(`chat_${payload.chatId}`).emit("receiveMessage", message)
    } catch (error: any) {
      logger.warn(`sendMessage error: ${error.message}`)
      socket.emit("error", { message: error.message || "Failed to send message" })
    }
  }
}

export default ChatsSocketController
