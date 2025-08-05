import { OrderStatus, PaymentStatus } from "@prisma/client"
import db from "../services/prisma.service"
import { BaseModel } from "./model"
import { DatabaseError } from "../errors"
import logger from "../lib/logger"

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
        data: { status: OrderStatus.Completed }
      })
      await db.orderPayment.update({
        where: { orderId: Number(id) },
        data: { status: PaymentStatus.Paid }
      })
      return order
    } catch (error) {
      logger.error("Failed to verify order:", error)
      throw new DatabaseError("Failed to verify order")
    }
  }
}
