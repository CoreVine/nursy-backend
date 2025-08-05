import { NextFunction, Request, Response } from "express"

import { KashierService } from "../services/kashier.service"

class PaymentController {
  static async createPaymentUrl(req: Request, res: Response, next: NextFunction) {
    const kashier = new KashierService()
    const orderId = Math.floor(Math.random() * 10000)

    const payment = kashier.initializePayment({
      amount: 150.5,
      currency: "EGP",
      id: "ORDER_" + orderId
    })

    return res.json({
      payment
    })
  }

  static async isGood(req: Request, res: Response, next: NextFunction) {
    const { query } = req
    const { id } = req.params
    const kashier = new KashierService()
    const isVerified = kashier.verifyWebhookSignature(query.signature! as string, query as any)
    return res.json({
      isVerified,
      id,
      query
    })
  }
}

export default PaymentController
