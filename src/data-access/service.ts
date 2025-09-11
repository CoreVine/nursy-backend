import { Prisma } from "@prisma/client"
import { BaseModel } from "./model"

import db from "../services/prisma.service"

export class ServiceModel extends BaseModel<typeof db.service> {
  static model = db.service
}
