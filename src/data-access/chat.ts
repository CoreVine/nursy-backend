import db from "../services/prisma.service"
import { BaseModel } from "./model"

export class ChatModel extends BaseModel<typeof db.chat> {
  static model = db.chat

  static async findChat(id: number) {
    return this.model.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            phoneNumber: true,
            isVerified: true
          }
        },
        nurse: {
          select: {
            id: true,
            username: true,
            email: true,
            phoneNumber: true,
            isVerified: true
          }
        }
      }
    })
  }

  static async createChat(userId: number, nurseId: number) {
    return this.model.create({
      data: {
        userId,
        nurseId
      }
    })
  }
}
