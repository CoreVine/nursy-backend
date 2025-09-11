import { Prisma, UserDataStatus } from "@prisma/client"
import db from "../services/prisma.service"

import { BaseModel } from "./model"

export class UserDataModel extends BaseModel<typeof db.userData> {
  static model = db.userData
}
