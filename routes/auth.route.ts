import { Router } from "express"

import AuthController from "../controllers/auth.controller"

import { validateBody } from "../middleware/validate.middleware"
import { AuthSchema } from "../schema"

export const authRouter = Router()

authRouter.post("/auth/login", validateBody(AuthSchema.login), AuthController.login)
authRouter.post("/auth/register", AuthController.register)
