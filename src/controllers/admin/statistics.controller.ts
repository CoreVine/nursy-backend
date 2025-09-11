import db from "../../services/prisma.service"

import { NextFunction, Request, Response } from "express"
import { TRequest } from "../../types"

import { json } from "../../lib/helpers"
import { UserDataStatus, UserType } from "@prisma/client"
import { UserModel } from "../../data-access/user"
import { UserDataModel } from "../../data-access/usersData"

export default class AdminStatisticsController {
  static async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query

      const dateFilter =
        startDate && endDate
          ? {
              gte: new Date(startDate as string),
              lte: new Date(endDate as string)
            }
          : undefined

      // Existing promises
      const countPatientsPromise = UserModel.count({ type: UserType.Patient, createdAt: dateFilter })
      const countNursesPromise = UserModel.count({ type: UserType.Nurse, createdAt: dateFilter })
      const countCustodiansPromise = UserModel.count({ type: UserType.Custodian, createdAt: dateFilter })
      const registerationsNeedsApprovalPromise = UserDataModel.count({ status: "Pending" })

      const highestVolumeClientAgg = await db.orderPayment.groupBy({
        by: ["userId"],
        where: {
          user: { type: UserType.Patient, createdAt: dateFilter }
        },
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: "desc" } },
        take: 1
      })

      let highestVolumeClient: any = null

      if (highestVolumeClientAgg.length > 0) {
        const topClient = highestVolumeClientAgg[0]
        const user = await db.user.findUnique({
          where: { id: topClient.userId },
          select: {
            id: true,
            username: true,
            email: true,
            phoneNumber: true,
            gender: true,
            createdAt: true
          }
        })

        highestVolumeClient = {
          ...user,
          totalSpent: topClient._sum.totalAmount || 0
        }
      }

      const highestVolumeNursePromise = db.user.findFirst({
        where: { type: UserType.Nurse, createdAt: dateFilter },
        orderBy: { wallet: { balance: "desc" } },
        include: { wallet: true }
      })

      const totalNursesIncomePromise = db.userWallet.aggregate({
        where: { user: { type: UserType.Nurse, createdAt: dateFilter } },
        _sum: { balance: true }
      })

      // 🔹 New statistics

      // 1. Total orders
      const totalOrdersPromise = db.order.count({
        where: { createdAt: dateFilter }
      })

      // 2. Orders by status
      const ordersByStatusPromise = db.order.groupBy({
        by: ["status"],
        where: { createdAt: dateFilter },
        _count: { id: true }
      })

      // 3. Total revenue
      const totalRevenuePromise = db.orderPayment.aggregate({
        where: { createdAt: dateFilter },
        _sum: { totalAmount: true }
      })

      // 4. Average order value
      const avgOrderValuePromise = db.orderPayment.aggregate({
        where: { createdAt: dateFilter },
        _avg: { totalAmount: true }
      })

      // 5. Most popular service
      const mostPopularServicePromise = db.order.groupBy({
        by: ["serviceId"],
        where: { createdAt: dateFilter },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 1
      })

      const topNurseByOrdersPromise = db.order.groupBy({
        by: ["nurseId"],
        where: { status: "Completed", createdAt: dateFilter },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 1
      })

      const walletTransactionsPromise = db.walletHistory.groupBy({
        by: ["type"],
        where: { createdAt: dateFilter },
        _sum: { amount: true }
      })

      const [countPatients, countNurses, countCustodians, registerationsNeedsApproval, highestVolumeNurseResult, totalNursesIncomeResult, totalOrders, ordersByStatus, totalRevenueResult, avgOrderValueResult, mostPopularServiceResult, topNurseByOrdersResult, walletTransactionsResult] =
        await Promise.all([
          countPatientsPromise,
          countNursesPromise,
          countCustodiansPromise,
          registerationsNeedsApprovalPromise,
          highestVolumeNursePromise,
          totalNursesIncomePromise,
          totalOrdersPromise,
          ordersByStatusPromise,
          totalRevenuePromise,
          avgOrderValuePromise,
          mostPopularServicePromise,
          topNurseByOrdersPromise,
          walletTransactionsPromise
        ])

      return json({
        data: {
          countPatients,
          countNurses,
          countCustodians,
          registerationsNeedsApproval,
          highestVolumeClient,
          highestVolumeNurse: {
            id: highestVolumeNurseResult?.id,
            username: highestVolumeNurseResult?.username,
            email: highestVolumeNurseResult?.email,
            phoneNumber: highestVolumeNurseResult?.phoneNumber,
            wallet: highestVolumeNurseResult?.wallet
          },
          totalNursesIncome: totalNursesIncomeResult._sum.balance || 0,
          totalOrders,
          ordersByStatus,
          totalRevenue: totalRevenueResult._sum.totalAmount || 0,
          avgOrderValue: avgOrderValueResult._avg.totalAmount || 0,
          mostPopularService: mostPopularServiceResult[0] || null,
          topNurseByOrders: topNurseByOrdersResult[0] || null,
          walletTransactions: walletTransactionsResult
        },
        res
      })
    } catch (err) {
      next(err)
    }
  }
}
