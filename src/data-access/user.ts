import { Prisma, UserDataStatus } from "@prisma/client"
import db from "../services/prisma.service"

import { BaseModel } from "./model"

export class UserModel extends BaseModel<typeof db.user> {
  static model = db.user

  static async findPk(id: number, include: Prisma.UserInclude = {}) {
    return await db.user.findUnique({
      where: { id },
      include
    })
  }

  static async findByEmail(email: string) {
    return await db.user.findUnique({
      where: { email }
    })
  }

  static async findFirstByEmail(email: string, id: number, select: Prisma.UserSelect = { id: true }) {
    return await db.user.findFirst({
      where: { email, id: { not: id } },
      select
    })
  }

  static async findFirstByUsername(username: string, id: number, select: Prisma.UserSelect = { id: true }) {
    return await db.user.findFirst({
      where: { username, id: { not: id } },
      select
    })
  }

  static async findFirstByPhoneNumber(phoneNumber: string, id: number, select: Prisma.UserSelect = { id: true }) {
    return await db.user.findFirst({
      where: { phoneNumber, id: { not: id } },
      select
    })
  }

  static async findByUsername(username: string, include: Prisma.UserInclude = {}) {
    return await db.user.findFirst({
      where: { username },
      include
    })
  }

  static async findByPhoneNumber(phoneNumber: string, include: Prisma.UserInclude = {}) {
    return await db.user.findUnique({
      where: { phoneNumber },
      include
    })
  }

  static async createVerificationToken(userId: number, token: string) {
    return await db.verificationToken.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    })
  }

  static async findVerificationToken(userId: number) {
    return await db.verificationToken.findUnique({
      where: { userId }
    })
  }

  static async registerUser(data: Prisma.UserCreateInput) {
    return await db.user.create({
      data
    })
  }

  static async updateNursePapers(userId: number, status: UserDataStatus) {
    return await db.userData.update({
      where: { userId },
      data: { status }
    })
  }

  static async updateNurseWallet(userId: number, balance: number, debit: number) {
    return await db.userWallet.update({
      where: { userId },
      data: { balance, debit }
    })
  }
}
