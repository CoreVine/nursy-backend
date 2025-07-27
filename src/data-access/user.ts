import db from "../services/prisma.service"

import { BaseModel } from "./model"

export class UserModel extends BaseModel<typeof db.user> {
  static model = db.order

  static findByEmail(email: string) {
    return db.user.findUnique({
      where: { email }
    })
  }

  static findByPhoneNumber(phoneNumber: string) {
    return db.user.findUnique({
      where: { phoneNumber }
    })
  }

  static createVerificationToken(userId: number, token: string) {
    return db.verificationToken.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    })
  }

  static findVerificationToken(userId: number) {
    return db.verificationToken.findUnique({
      where: { userId }
    })
  }
}
