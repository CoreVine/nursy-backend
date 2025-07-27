import { json } from "../lib/helpers"

import { BadRequestError, NotFoundError, UnauthorizedError } from "../errors"
import { NextFunction, Request, Response } from "express"
import { MessageModel } from "../data-access/message"
import { ChatModel } from "../data-access/chat"
import { TRequest } from "../types"

class ChatController {
  static async getCurrentUserChats(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as TRequest).user

      const { page = 1, pageSize = 10, search } = req.query

      const pageNumber = parseInt(page as string, 10)
      const pageSizeNumber = parseInt(pageSize as string, 10)

      const chats = await ChatModel.paginate({
        page: pageNumber,
        pageSize: pageSizeNumber,
        include: {
          user: { select: { id: true, username: true, email: true, phoneNumber: true, isVerified: true } },
          nurse: { select: { id: true, username: true, email: true, phoneNumber: true, isVerified: true } }
        },
        where: {
          nurseId: user?.id,
          ...(search && {
            OR: [{ user: { username: { contains: search as string } } }, { user: { email: { contains: search as string } } }, { user: { phoneNumber: { contains: search as string } } }]
          })
        },
        orderBy: {
          id: "desc"
        }
      })

      return json({
        message: "User chats fetched successfully",
        status: 200,
        data: chats,
        res
      })
    } catch (error) {
      next(error)
    }
  }

  static async getChatDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { chatId } = req.params
      if (isNaN(+chatId)) throw new BadRequestError("Chat ID must be a number")

      const id = +chatId

      const chat = await ChatModel.findChat(id)
      if (!chat) throw new NotFoundError("Chat not found")

      if (chat.nurseId !== (req as TRequest).user?.id) throw new UnauthorizedError("You are not authorized to view this chat")

      return json({
        message: "Chat details fetched successfully",
        status: 200,
        data: chat,
        res
      })
    } catch (error) {
      next(error)
    }
  }

  static async getChatMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { chatId } = req.params
      const { page = 1, pageSize = 10 } = req.query

      if (isNaN(+chatId)) throw new BadRequestError("Chat ID must be a number")
      if (isNaN(+page) || isNaN(+pageSize)) throw new BadRequestError("Page and pageSize must be numbers")

      const id = +chatId
      const pageNumber = +page
      const pageSizeNumber = +pageSize

      const chat = await ChatModel.findChat(id)
      if (!chat) throw new NotFoundError("Chat not found")

      if (chat.nurseId !== (req as TRequest).user?.id) throw new UnauthorizedError("You are not authorized to view this chat")

      const messages = await MessageModel.paginate({
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              email: true,
              phoneNumber: true,
              isVerified: true
            }
          }
        },
        where: {
          chatId: id
        }
      })

      return json({
        message: "Chat messages fetched successfully",
        status: 200,
        data: messages,
        res
      })
    } catch (error) {
      next(error)
    }
  }
}

export default ChatController
