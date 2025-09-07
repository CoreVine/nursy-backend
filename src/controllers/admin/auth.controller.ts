import bcrypt from "bcryptjs"
import db from "../../services/prisma.service"

import jwtService from "../../services/jwt.service"

import { LoginSchema, RegisterSchema, UpdatePasswordSchema, UpdateInformationSchema } from "../../routes/admin/auth.route"
import { BadRequestError, NotFoundError, UnauthorizedError, ValidationError } from "../../errors"
import { NextFunction, Request, Response } from "express"
import { AdminJwtPayload, TRequest } from "../../types"
import { AdminModel } from "../../data-access/admin"

import { json } from "../../lib/helpers"

export default class AdminAuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = LoginSchema.safeParse(req.body)!
      if (!parsed.success) throw new ValidationError("Errors", parsed.error)

      const { email, password } = parsed.data

      const admin = await AdminModel.findByEmail(email)
      if (!admin) throw new NotFoundError("Admin not found")

      const isPasswordValid = await bcrypt.compare(password, admin.password)
      if (!isPasswordValid) throw new UnauthorizedError("Incorrect credentials")

      const { password: adminPassword, ...rest } = admin

      const payload: AdminJwtPayload = {
        id: admin.id,
        email: admin.email,
        username: admin.username
      }

      const token = jwtService.signAdminToken(payload)

      return json({
        message: "Logged in successfully",
        status: 200,
        data: { admin: rest, token },
        res
      })
    } catch (error) {
      next(error)
    }
  }

  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = RegisterSchema.safeParse(req.body)!
      if (!parsed.success) throw new ValidationError("Errors", parsed.error)

      const { password, username, email } = parsed.data

      const emailExists = await AdminModel.findByEmail(email)
      if (emailExists) throw new BadRequestError("E-mail already exists")

      const hashedPassword = await bcrypt.hash(password, 10)

      const admin = await AdminModel.registerAdmin({
        username,
        email,
        password: hashedPassword
      })

      const { password: adminPassword, ...rest } = admin

      const payload: AdminJwtPayload = {
        id: admin.id,
        email: admin.email,
        username: admin.username
      }

      const token = jwtService.signAdminToken(payload)

      return json({
        message: "Registered successfully",
        status: 201,
        data: { token, admin: rest },
        res
      })
    } catch (error) {
      next(error)
    }
  }

  static async getAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const admin = (req as TRequest).admin
      if (!admin) throw new NotFoundError("Admin not found")

      const realAdmin = await AdminModel.findPk(admin.id)
      if (!realAdmin) throw new NotFoundError("Admin not found")

      const { password, ...payload } = realAdmin

      return json({
        message: "Admin retrieved successfully",
        status: 200,
        data: payload,
        res
      })
    } catch (error) {
      next(error)
    }
  }

  static async updateInformation(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, success, error } = UpdateInformationSchema.safeParse(req.body)
      if (!success) throw new ValidationError("Errors", error)

      const { username, email } = data

      const isUsernameExists = await AdminModel.findFirstByUsername(username!, req?.admin?.id!)
      if (isUsernameExists) throw new BadRequestError("Username already exists")

      const isEmailExists = await AdminModel.findFirstByEmail(email!, req?.admin?.id!)
      if (isEmailExists) throw new BadRequestError("E-mail already exists")

      const mainAdmin = await db.admin.findFirst({
        where: { username, id: { not: req?.admin?.id } },
        select: { id: true }
      })

      const updatedAdmin = await db.admin.update({
        where: { id: req?.admin?.id },
        data: {
          username,
          email
        }
      })

      return json({
        message: "Admin information updated successfully",
        status: 200,
        data: updatedAdmin,
        res
      })
    } catch (error) {
      next(error)
    }
  }

  static async updatePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, success, error } = UpdatePasswordSchema.safeParse(req.body)
      if (!success) throw new ValidationError("Errors", error)

      const { currentPassword, newPassword } = data
      const admin = req.admin

      const adminWithPassword = await db.admin.findUnique({
        where: { id: admin?.id },
        select: { password: true }
      })

      const isPasswordCorrect = await bcrypt.compare(currentPassword, adminWithPassword?.password || "")
      if (!isPasswordCorrect) throw new UnauthorizedError("Current password is incorrect")

      const hashedPassword = await bcrypt.hash(newPassword, 10)
      await db.admin.update({
        where: { id: admin?.id },
        data: { password: hashedPassword }
      })

      return json({
        message: "Password updated successfully",
        status: 200,
        res
      })
    } catch (error) {
      next(error)
    }
  }
}
