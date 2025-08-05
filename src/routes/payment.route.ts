import { Router } from "express"

import { isVerifiedMiddleware } from "../middleware/is-verified.middleware"
import { isAuthenticatedMiddleware } from "../middleware/auth.middleware"
import { isUserOfTypeMiddleware } from "../middleware/user-type.middleware"

import PaymentController from "../controllers/payment.controller"

export const paymentRouter = Router()

paymentRouter.post("/test", PaymentController.createPaymentUrl)
paymentRouter.get("/success/:id", PaymentController.isGood)

export default paymentRouter
