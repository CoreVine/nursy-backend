import { OrderStatus, PaymentStatus } from "@prisma/client"
import { DatabaseError } from "../errors"
import { BaseModel } from "./model"

import logger from "../lib/logger"
import db from "../services/prisma.service"

export class OrderModel extends BaseModel<typeof db.order> {
  static model = db.order

  static async findPendingOrders() {
    return this.model.findMany({
      where: { status: "Pending" }
    })
  }

  static async verifyOrder(id: number) {
    try {
      const order = await db.order.update({
        where: { id: Number(id) },
        data: { status: OrderStatus.Completed },
        include: { payment: true, service: true, specificService: true, illnessType: true }
      })
      await db.inProgressOrder.updateMany({
        where: { orderId: Number(id) },
        data: { status: "Completed" }
      })
      await db.orderPayment.updateMany({
        where: { orderId: Number(id) },
        data: { status: "Paid" }
      })
      return order
    } catch (error) {
      console.error(error)
      logger.error("Failed to verify order:", error)
      throw new DatabaseError("Failed to verify order")
    }
  }
}
