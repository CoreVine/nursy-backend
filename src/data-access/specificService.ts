import { Prisma } from "@prisma/client"
import { BaseModel } from "./model"

import db from "../services/prisma.service"

export class SpecificServiceModel extends BaseModel<typeof db.specificService> {
  static model = db.specificService
}
