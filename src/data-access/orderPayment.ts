import { Prisma } from "@prisma/client"
import { BaseModel } from "./model"

import db from "../services/prisma.service"

export class OrderPaymentModel extends BaseModel<typeof db.orderPayment> {
  static model = db.orderPayment
}
