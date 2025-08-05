import { Router } from "express"

import PaymentController from "../controllers/payment.controller"

export const paymentRouter = Router()

paymentRouter.get("/:id/verify", PaymentController.verifyPayment)

export default paymentRouter
