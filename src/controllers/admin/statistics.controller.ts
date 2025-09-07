import db from "../../services/prisma.service"

import { NextFunction, Request, Response } from "express"
import { TRequest } from "../../types"

import { json } from "../../lib/helpers"
import { UserDataStatus, UserType } from "@prisma/client"

export default class AdminStatisticsController {
  static async getStatistics(req: Request, res: Response, next: NextFunction) {
    const countPatientsPromise = db.user.count({ where: { type: UserType.Patient } })
    const countNursesPromise = db.user.count({ where: { type: UserType.Nurse } })
    const countCustodiansPromise = db.user.count({ where: { type: UserType.Custodian } })
    const registerationsNeedsApprovalPromise = db.userData.count({ where: { status: UserDataStatus.Pending } })

    const highestVolumeClient = db.user.findFirst({
      where: { type: UserType.Patient },
      orderBy: {
        wallet: {
          balance: "desc"
        }
      },
      include: {
        wallet: true // so you can see the balance directly
      }
    })

    const highestVolumeNurse = db.user.findFirst({
      where: { type: UserType.Nurse },
      orderBy: {
        wallet: {
          balance: "desc"
        }
      },
      include: {
        wallet: true // so you can see the balance directly
      }
    })

    const totalNursesIncome = db.userWallet.aggregate({
      where: { user: { type: UserType.Nurse } },
      _sum: { balance: true }
    })

    const [countPatients, countNurses, countCustodians, registerationsNeedsApproval, highestVolumeClientResult, highestVolumeNurseResult, totalNursesIncomeResult] = await Promise.all([
      countPatientsPromise,
      countNursesPromise,
      countCustodiansPromise,
      registerationsNeedsApprovalPromise,
      highestVolumeClient,
      highestVolumeNurse,
      totalNursesIncome
    ])

    return json({
      data: { countPatients, countNurses, countCustodians, registerationsNeedsApproval, highestVolumeClient: highestVolumeClientResult, highestVolumeNurse: highestVolumeNurseResult, totalNursesIncome: totalNursesIncomeResult._sum.balance || 0 },
      res
    })
  }
}
