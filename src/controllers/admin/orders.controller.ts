import logger from "../../lib/logger"

import { NextFunction, Request, Response } from "express"
import { BadRequestError } from "../../errors"
import { OrderModel } from "../../data-access/order"
import { Prisma } from "@prisma/client"

import { userSelector } from "../../config/db-selectors.config"
import { json } from "../../lib/helpers"

export default class AdminOrdersController {
  static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, search, orderBy = "id", orderType = "desc" } = req.query

      const where: Prisma.UserWhereInput = {}

      const orders = await OrderModel.paginate({
        page: Number(page),
        take: Number(limit),
        orderBy: { [orderBy as string]: orderType },
        select: {
          nurse: userSelector(),
          user: userSelector(),
          payment: true,
          specificService: true,
          service: true,
          illnessType: true
        }
      })

      return json({ res, data: orders })
    } catch (error) {
      return next(error)
    }
  }

  static async getOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params

      const order = await OrderModel.findById(+orderId, {
        nurse: userSelector(),
        user: userSelector(),
        payment: true,
        specificService: true,
        service: true,
        illnessType: true
      })

      if (!order) throw new BadRequestError("Order not found")

      return json({ res, data: order })
    } catch (error) {
      return next(error)
    }
  }
}
