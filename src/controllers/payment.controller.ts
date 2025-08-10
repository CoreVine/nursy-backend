import { NextFunction, Request, Response } from "express"

import { KashierService } from "../services/kashier.service"
import { json } from "../lib/helpers"
import { OrderModel } from "../data-access/order"

class PaymentController {
  static async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentStatus } = req.query
      const { query } = req
      const { id } = req.params

      const kashier = new KashierService()
      const isVerified = kashier.verifyWebhookSignature(query.signature! as string, query as any)

      if (isVerified) {
        if (paymentStatus && paymentStatus === "SUCCESS") {
          const order = await OrderModel.verifyOrder(Number(id))
          return json({
            message: "Payment verified successfully",
            status: 200,
            data: { order },
            res
          })
        } else {
          return json({
            message: "Failed to verify payment status",
            status: 200,
            data: { isVerified },
            res
          })
        }
      }
    } catch (error) {
      next(error)
    }
  }
}

export default PaymentController
