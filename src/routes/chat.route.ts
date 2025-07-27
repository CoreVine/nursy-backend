import { Router } from "express"

import { isAuthenticatedMiddleware } from "../middleware/auth.middleware"
import { isVerifiedMiddleware } from "../middleware/is-verified.middleware"

import ChatController from "../controllers/chat.controller"

export const chatRouter = Router()

chatRouter.get("/", isAuthenticatedMiddleware, isVerifiedMiddleware, ChatController.getCurrentUserChats)
chatRouter.get("/:chatId", isAuthenticatedMiddleware, isVerifiedMiddleware, ChatController.getChatDetails)
chatRouter.get("/:chatId/messages", isAuthenticatedMiddleware, isVerifiedMiddleware, ChatController.getChatMessages)

export default chatRouter
