import db from "../services/prisma.service"
import { BaseModel } from "./model"

export class OrderModel extends BaseModel<typeof db.order> {
  static model = db.order

  static async findPendingOrders() {
    return this.model.findMany({
      where: { status: "Pending" }
    })
  }
}
