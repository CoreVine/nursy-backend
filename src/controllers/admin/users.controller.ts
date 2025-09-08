import db from "../../services/prisma.service"

import { NextFunction, Request, Response } from "express"

import { json } from "../../lib/helpers"
import { Prisma, UserType } from "@prisma/client"

import { UserModel } from "../../data-access/user"
import { userSelector } from "../../config/db-selectors.config"
import { OrderModel } from "../../data-access/order"
import { BadRequestError } from "../../errors"
import { OrderPaymentModel } from "../../data-access/orderPayment"
import logger from "../../lib/logger"

export default class AdminUsersController {
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { type = "all", page = 1, limit = 10, search, orderBy = "id", orderType = "desc" } = req.query

      const where: Prisma.UserWhereInput = {}

      if (type !== "all") where.type = type as UserType

      const users = await UserModel.paginate({
        page: Number(page),
        take: Number(limit),
        orderBy: { [orderBy as string]: orderType },
        select: userSelector("id", "username", "email", "type", "phoneNumber", "nationalIdPicture", "longitude", "latitude", "gender", "birthDate", "isVerified", "verifiedAt", "verifiedBy", "userData", "wallet", "createdAt", "updatedAt").select,
        where: {
          ...where,
          OR: search ? [{ username: { contains: String(search) } }, { email: { contains: String(search) } }] : undefined
        }
      })

      return json({ res, data: users })
    } catch (error) {
      return next(error)
    }
  }

  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params

      const user = await db.user.findUnique({
        where: { id: Number(userId) },
        select: userSelector("id", "username", "email", "type", "phoneNumber", "nationalIdPicture", "longitude", "latitude", "gender", "birthDate", "isVerified", "verifiedAt", "verifiedBy", "userData", "wallet", "createdAt", "updatedAt").select
      })

      return json({ res, data: user })
    } catch (error) {
      return next(error)
    }
  }

  static async getUserStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params

      const ordersCount = db.order.groupBy({
        by: ["status"],
        where: {
          OR: [{ userId: Number(userId) }, { nurseId: Number(userId) }]
        },
        _count: {
          _all: true
        }
      })
      const totalMessagesCount = db.message.count({
        where: {
          senderId: Number(userId)
        }
      })
      const totalChatsCount = db.chat.count({
        where: {
          OR: [{ userId: Number(userId) }, { nurseId: Number(userId) }]
        }
      })
      const payments = db.orderPayment.groupBy({
        by: ["status"],
        _count: {
          _all: true
        },
        where: {
          order: {
            OR: [{ userId: Number(userId) }, { nurseId: Number(userId) }]
          }
        }
      })

      const [orders, messages, chats, paymentsData] = await Promise.all([ordersCount, totalMessagesCount, totalChatsCount, payments])

      return json({
        res,
        data: {
          ordersCount: orders.map((o) => ({
            status: o.status,
            count: o._count._all
          })),
          paymentsCount: paymentsData.map((p) => ({
            status: p.status,
            count: p._count._all
          })),
          totalMessagesCount: messages,
          totalChatsCount: chats
        }
      })
    } catch (error) {
      return next(error)
    }
  }

  static async getUserOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params
      const { page = 1, limit = 10, orderType = "desc", orderBy = "id" } = req.query

      const id = +userId

      if (isNaN(id)) throw new BadRequestError("Invalid user ID")

      const orders = await OrderModel.paginate({
        page: +page,
        take: +limit,
        orderBy: { [orderBy as string]: orderType },
        where: { OR: [{ userId: id }, { nurseId: id }] },
        include: { service: true, specificService: true, illnessType: true, nurse: userSelector(), user: userSelector(), payment: true }
      })

      logger.info(`Fetched orders for user ID: ${userId}`)

      return json({ res, data: orders })
    } catch (error) {
      return next(error)
    }
  }

  static async getUserOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, orderId } = req.params

      const order = await OrderModel.findById(+orderId, {
        nurse: userSelector(),
        user: userSelector(),
        payment: true,
        specificService: true,
        service: true,
        illnessType: true
      })

      if (!order || (order.userId !== +userId && order.nurseId !== +userId)) throw new BadRequestError("Order not found")

      logger.info(`Fetched order for user ID: ${userId}`)

      return json({ res, data: order })
    } catch (error) {
      return next(error)
    }
  }

  static async getUserPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params
      const { page = 1, limit = 10, orderType = "desc", orderBy = "id" } = req.query

      const id = +userId

      if (isNaN(id)) throw new BadRequestError("Invalid user ID")

      const payments = await OrderPaymentModel.paginate({
        page: +page,
        take: +limit,
        orderBy: { [orderBy as string]: orderType },
        where: { userId: id }
      })

      return json({ res, data: payments })
    } catch (error) {
      return next(error)
    }
  }

  static async getUserPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, paymentId } = req.params
      const payment = await OrderPaymentModel.findById(+paymentId)
      if (!payment || payment.userId !== +userId) throw new BadRequestError("Payment not found")

      return json({ res, data: payment })
    } catch (error) {
      return next(error)
    }
  }
}
