import { Prisma } from "@prisma/client"
import { BaseModel } from "./model"

import db from "../services/prisma.service"

export class IllnessTypeModel extends BaseModel<typeof db.illnessType> {
  static model = db.illnessType
}
