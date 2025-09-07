import { Prisma } from "@prisma/client"
import db from "../services/prisma.service"

import { BaseModel } from "./model"

export class AdminModel extends BaseModel<typeof db.admin> {
  static model = db.admin

  static async findPk(id: number) {
    return await db.admin.findUnique({
      where: { id }
    })
  }

  static async findByEmail(email: string) {
    return await db.admin.findUnique({
      where: { email }
    })
  }

  static async findFirstByEmail(email: string, id: number, select: Prisma.UserSelect = { id: true }) {
    return await db.admin.findFirst({
      where: { email, id: { not: id } },
      select
    })
  }

  static async findFirstByUsername(username: string, id: number, select: Prisma.UserSelect = { id: true }) {
    return await db.admin.findFirst({
      where: { username, id: { not: id } },
      select
    })
  }

  static async findByUsername(username: string) {
    return await db.admin.findFirst({
      where: { username }
    })
  }

  static async registerAdmin(data: Prisma.AdminCreateInput) {
    return await db.admin.create({
      data
    })
  }
}
