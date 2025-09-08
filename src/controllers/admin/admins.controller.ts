import bcrypt from "bcryptjs"
import db from "../../services/prisma.service"

import { json } from "../../lib/helpers"

import { CreateAdminSchema, UpdateAdminSchema } from "../../routes/admin/admins.route"
import { NextFunction, Request, Response } from "express"
import { BadRequestError, NotFoundError } from "../../errors"
import { AdminModel } from "../../data-access/admin"

export default class AdminsController {
  static async getAdmins(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, search, orderBy = "id", orderType = "desc" } = req.query

      const admins = await AdminModel.paginate({
        page: Number(page),
        take: Number(limit),
        orderBy: { [orderBy as string]: orderType },
        select: { id: true, username: true, email: true, createdAt: true, updatedAt: true },
        where: {
          id: { not: Number(req?.admin?.id) },
          OR: search ? [{ username: { contains: String(search) } }, { email: { contains: String(search) } }] : undefined
        }
      })

      return json({ res, data: admins })
    } catch (error) {
      return next(error)
    }
  }

  static async getAdminById(req: Request, res: Response, next: NextFunction) {
    try {
      const { adminId } = req.params
      const admin = await AdminModel.findPk(+adminId)
      if (!admin) throw new NotFoundError("Admin not found")

      return json({ res, data: admin })
    } catch (error) {
      return next(error)
    }
  }

  static async createAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, success } = CreateAdminSchema.safeParse(req.body)
      if (!success) throw new BadRequestError("Invalid request data")

      const isUsernameTaken = await db.admin.findFirst({ where: { username: data.username } })
      if (isUsernameTaken) throw new BadRequestError("Username is already taken")

      const isEmailTaken = await db.admin.findFirst({ where: { email: data.email } })
      if (isEmailTaken) throw new BadRequestError("Email is already taken")

      const hashedPassword = await bcrypt.hash(data.password, 10)

      const admin = await AdminModel.create({
        data: { ...data, password: hashedPassword }
      })

      if (!admin) throw new BadRequestError("Failed to create admin")

      return json({ res, data: admin, status: 201, message: "Admin created successfully" })
    } catch (error) {
      return next(error)
    }
  }

  static async updateAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, success } = UpdateAdminSchema.safeParse(req.body)
      if (!success) throw new BadRequestError("Invalid request data")

      const { adminId } = req.params
      const admin = await AdminModel.findPk(+adminId)

      if (!admin) throw new NotFoundError("Admin not found")

      const isUsernameTaken = await AdminModel.findFirstByUsername(data.username, admin.id)
      if (isUsernameTaken) throw new BadRequestError("Username is already taken")

      const isEmailTaken = await AdminModel.findFirstByEmail(data.email, admin.id)
      if (isEmailTaken) throw new BadRequestError("Email is already taken")

      const updatedAdmin = await AdminModel.update(admin.id, data)

      return json({ res, data: updatedAdmin, message: "Admin updated successfully" })
    } catch (error) {
      return next(error)
    }
  }

  static async deleteAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { adminId } = req.params
      const admin = await AdminModel.findPk(+adminId)

      if (!admin) throw new NotFoundError("Admin not found")
      await AdminModel.delete(admin.id)

      return json({ res, data: null, message: "Admin deleted successfully" })
    } catch (error) {
      return next(error)
    }
  }
}
