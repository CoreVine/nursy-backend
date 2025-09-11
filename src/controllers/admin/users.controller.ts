import logger from "../../lib/logger"
import db from "../../services/prisma.service"

import { userSelector } from "../../config/db-selectors.config"
import { json } from "../../lib/helpers"

import { NextFunction, Request, Response } from "express"
import { Prisma, UserDataStatus, UserType } from "@prisma/client"
import { UserModel } from "../../data-access/user"
import { OrderModel } from "../../data-access/order"
import { BadRequestError, NotFoundError } from "../../errors"
import { OrderPaymentModel } from "../../data-access/orderPayment"
import { UpdateNurseWalletSchema } from "../../routes/admin/users.route"
import { WalletHistoryModel } from "../../data-access/walletHistory"

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

  static async getPendingNurses(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, search, orderBy = "updatedAt", orderType = "desc" } = req.query

      const users = await UserModel.paginate({
        select: {
          ...userSelector("id", "username", "email", "type", "phoneNumber", "nationalIdPicture", "longitude", "latitude", "gender", "birthDate", "isVerified", "verifiedAt", "verifiedBy", "userData", "wallet", "createdAt", "updatedAt").select,
          userData: true
        },
        where: {
          type: "Nurse",
          userData: { status: { in: [UserDataStatus.Pending, UserDataStatus.Rejected] } },
          OR: search ? [{ username: { contains: String(search) } }, { email: { contains: String(search) } }] : undefined
        },
        page: Number(page),
        take: Number(limit),
        orderBy: { [orderBy as string]: orderType }
      })

      return json({ res, data: users })
    } catch (error) {
      return next(error)
    }
  }

  static async getNursePapers(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params
      const user = await UserModel.findPk(+userId, {
        userData: true
      })

      if (!user) throw new NotFoundError("Nurse not found")
      if (user.type !== "Nurse") throw new BadRequestError("Nurse is not a nurse")
      if (!user.userData) throw new NotFoundError("Nurse papers not found")

      return json({ res, data: user.userData })
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

  static async updateNursePapersStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params
      const { status } = req.body

      const user = await UserModel.findById(+userId)
      if (!user) throw new BadRequestError("User not found")

      if (user.type !== "Nurse") throw new BadRequestError("User is not a nurse")

      const updatedPapers = await UserModel.updateNursePapers(+userId, status)
      if (!updatedPapers) throw new BadRequestError("Failed to update nurse papers status")

      logger.info(`Nurse (ID: ${userId}) papers status updated to ${status}`)

      return json({ res, data: updatedPapers, message: "Nurse papers status updated successfully" })
    } catch (error) {
      return next(error)
    }
  }

  static async getNurseWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params

      const user = await UserModel.findById(+userId)
      if (!user) throw new BadRequestError("User not found")

      if (user.type !== "Nurse") throw new BadRequestError("User is not a nurse")

      const wallet = await db.userWallet.findUnique({ where: { userId: user.id! } })
      if (!wallet) throw new NotFoundError("Nurse wallet not found")

      logger.info(`Fetched wallet for nurse ID: ${userId}`, wallet)

      return json({ res, data: wallet })
    } catch (error) {
      return next(error)
    }
  }

  static async getNurseWalletHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, page = 1, limit = 10, search } = req.params

      const user = await UserModel.findById(+userId)
      if (!user) throw new BadRequestError("User not found")

      if (user.type !== "Nurse") throw new BadRequestError("User is not a nurse")

      const history = await WalletHistoryModel.paginate({
        where: {
          description: search ? { contains: String(search) } : undefined,
          wallet: { userId: user.id! }
        },
        include: {
          wallet: true,
          byAdmin: userSelector("id", "username", "email"),
          fromUser: userSelector("id", "username", "email", "phoneNumber")
        },
        page: +page,
        take: +limit,
        orderBy: { createdAt: "desc" }
      })

      return json({ res, data: history })
    } catch (error) {
      return next(error)
    }
  }

  static async getNurseWalletHistoryItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, historyId } = req.params

      const user = await UserModel.findById(+userId)
      if (!user) throw new BadRequestError("User not found")

      if (user.type !== "Nurse") throw new BadRequestError("User is not a nurse")

      const history = await WalletHistoryModel.findPk(+historyId, { wallet: true, byAdmin: userSelector("id", "username", "email"), fromUser: userSelector("id", "username", "email", "phoneNumber") })
      if (!history) throw new NotFoundError("Wallet history item not found")

      if (history.wallet.userId !== user.id) throw new BadRequestError("Wallet history item not found for this nurse")

      return json({ res, data: history })
    } catch (error) {
      return next(error)
    }
  }

  static async updateNurseWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params
      const { success, data } = UpdateNurseWalletSchema.safeParse(req.body)

      if (!success) throw new BadRequestError("Invalid request data")

      const user = await UserModel.findById(+userId)
      if (!user) throw new NotFoundError("User not found")

      if (user.type !== "Nurse") throw new BadRequestError("User is not a nurse")

      const wallet = await db.userWallet.findUnique({ where: { userId: user.id! } })
      if (!wallet) throw new NotFoundError("Nurse wallet not found")

      await db.userWallet.update({
        where: { id: wallet.id },
        data: {
          balance: data.type === "Credit" ? { increment: data.amount } : wallet.balance,
          debit: data.type === "Debit" ? { increment: data.amount } : wallet.debit
        }
      })

      await db.walletHistory.create({
        data: {
          walletId: wallet.id,
          amount: data.amount,
          type: data.type,
          description: data.description,
          byAdminId: req.admin!.id
        }
      })

      return json({ res, message: "Nurse Wallet updated successfully" })
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
