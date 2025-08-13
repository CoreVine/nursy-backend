import { BaseSocketController } from "./base.socket.controller"
import { Socket, Server as SocketIOServer } from "socket.io"

import logger from "../../lib/logger"
import db from "../../services/prisma.service"

import { NotFoundError, ForbiddenError, BadRequestError } from "../../errors"
import { toSocketError } from "../../lib/utils"

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

    socket.on("chats.join", async (payload: JoinChatPayload) => {
      try {
        const data = await ChatsSocketController.handleJoinChat(socket, payload)
        socket.emit("chats.joined", { success: true, data })
        socket.to(`chat_${payload.chatId}`).emit("chats.user.joined", { success: true, data })
      } catch (err) {
        logger.warn(`[ChatsSocketController]: joinChat error:`, err)
        socket.emit("chats.joined", { success: false, error: toSocketError(err) })
      }
    })

    socket.on("chats.leave", async (payload: LeaveChatPayload) => {
      try {
        const data = await ChatsSocketController.handleLeaveChat(socket, payload)
        socket.emit("chats.left", { success: true, data })
        socket.to(`chat_${payload.chatId}`).emit("chats.user.left", { success: true, data })
      } catch (err) {
        logger.warn(`[ChatsSocketController]: leaveChat error:`, err)
        socket.emit("chats.left", { success: false, error: toSocketError(err) })
      }
    })

    socket.on("chats.sendMessage", async (payload: SendMessagePayload) => {
      try {
        const message = await ChatsSocketController.handleSendMessage(socket, io, payload)
        io.to(`chat_${payload.chatId}`).emit("chats.messageSent", { success: true, data: message })
      } catch (err) {
        logger.warn(`[ChatsSocketController]: sendMessage error:`, err)
        io.to(`chat_${payload.chatId}`).emit("chats.messageSent", { success: false, error: toSocketError(err) })
      }
    })
  }

  static async authorizeChatAccess(userId: number, chatId: number) {
    const chat = await db.chat.findUnique({
      where: { id: Number(chatId) },
      select: { userId: true, nurseId: true }
    })
    if (!chat) throw new NotFoundError("Chat not found")
    const isAuthorized = chat.userId === userId || chat.nurseId === userId
    if (!isAuthorized) throw new ForbiddenError("You are not authorized to access this chat.")
    return chat
  }

  static async handleJoinChat(socket: Socket, payload: JoinChatPayload) {
    const user = await ChatsSocketController.getUserFromSocket(socket)
    await ChatsSocketController.authorizeChatAccess(user.id, payload.chatId)

    socket.join(`chat_${payload.chatId}`)
    logger.info(`Socket ${socket.id} (user ${user.id}) joined chat_${payload.chatId}`)
    return { chatId: payload.chatId, userId: user.id }
  }

  static async handleLeaveChat(socket: Socket, payload: LeaveChatPayload) {
    const user = await ChatsSocketController.getUserFromSocket(socket)
    await ChatsSocketController.authorizeChatAccess(user.id, payload.chatId)

    socket.leave(`chat_${payload.chatId}`)
    logger.info(`Socket ${socket.id} (user ${user.id}) left chat_${payload.chatId}`)
    return { chatId: payload.chatId, userId: user.id }
  }

  static async handleSendMessage(socket: Socket, io: SocketIOServer, payload: SendMessagePayload) {
    const user = await ChatsSocketController.getUserFromSocket(socket)
    await ChatsSocketController.authorizeChatAccess(user.id, payload.chatId)

    if (!payload.content?.trim() && !payload.attachment) {
      throw new BadRequestError("Message content or attachment is required")
    }

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
      throw new BadRequestError("Failed to create message")
    }
    logger.info(`(user ${user.id}) sent message in chat_${payload.chatId}`)
    io.to(`chat_${payload.chatId}`).emit("receiveMessage", { success: true, data: message })
    return message
  }
}

export default ChatsSocketController
