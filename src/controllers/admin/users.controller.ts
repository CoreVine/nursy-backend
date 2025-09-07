import db from "../../services/prisma.service"

import { NextFunction, Request, Response } from "express"

import { json } from "../../lib/helpers"
import { Prisma, UserType } from "@prisma/client"
import { BadRequestError } from "../../errors"
import { UserTypeList } from "../../lib/type-lists"

export default class AdminUsersController {
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { type = "all", page = 1, limit = 10, search, orderBy, orderType } = req.query

      const where: Prisma.UserWhereInput = {}

      if (type !== "all") {
        if (!UserTypeList.includes(type as any)) throw new BadRequestError("Invalid user type")
        where.type = type as UserType
      }

      const skip = page && limit ? (Number(page) - 1) * Number(limit) : 0
      const users = await db.user.findMany()

      return json({
        res,
        data: users
      })
    } catch (error) {
      return next(error)
    }
  }
}
