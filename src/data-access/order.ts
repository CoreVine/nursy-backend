import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client"
import { DatabaseError } from "../errors"
import { BaseModel } from "./model"

import { userSelector } from "../config/db-selectors.config"

import logger from "../lib/logger"
import db from "../services/prisma.service"

export class OrderModel extends BaseModel<typeof db.order> {
  static model = db.order

  static findPk(id: number, include: Prisma.OrderInclude = {}) {
    return this.model.findUnique({
      where: { id: Number(id) },
      include: {
        user: userSelector(),
        nurse: userSelector(),
        specificService: true,
        illnessType: true,
        ...include
      }
    })
  }

  static async findPendingOrders() {
    return this.model.findMany({
      where: { status: "Pending" }
    })
  }

  static async verifyOrder(id: number, query: any) {
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
        data: {
          kashierTranscationId: query.transactionId as string,
          kashierOrderId: query.orderId as string,
          kashierResponse: JSON.stringify(query),
          cardBrand: query.cardBrand as string,
          merchantOrderId: query.merchantOrderId as string,
          orderReference: query.orderReference as string,
          signature: query.signature as string,
          status: "Paid"
        }
      })
      return order
    } catch (error) {
      console.error(error)
      logger.error("Failed to verify order:", error)
      throw new DatabaseError("Failed to verify order")
    }
  }
}
