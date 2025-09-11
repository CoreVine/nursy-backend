import { BaseModel } from "./model"

import db from "../services/prisma.service"
import { Prisma } from "@prisma/client"

export class WalletHistoryModel extends BaseModel<typeof db.walletHistory> {
  static model = db.walletHistory

  static findPk(id: number, include: Prisma.WalletHistoryInclude = {}) {
    return this.model.findUnique({
      where: { id: Number(id) },
      include
    })
  }
}
