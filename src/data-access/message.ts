import db from "../services/prisma.service"
import { BaseModel } from "./model"

export class MessageModel extends BaseModel<typeof db.message> {
  static model = db.message
}
