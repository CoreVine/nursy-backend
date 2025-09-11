import { json } from "../../lib/helpers"

import { NextFunction, Request, Response } from "express"
import { BadRequestError, NotFoundError } from "../../errors"
import { IllnessTypeModel } from "../../data-access/illnessType"
import { IllnessTypeSchema } from "../../routes/admin/illness-types.route"

export default class IllnessTypesController {
  static async getIllnessTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, search = "" } = req.query

      const illnessTypes = await IllnessTypeModel.paginate({
        page: Number(page),
        take: Number(limit),
        orderBy: { id: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true
        },
        where: {
          name: search ? { contains: String(search) } : undefined
        }
      })

      return json({ res, data: illnessTypes })
    } catch (error) {
      return next(error)
    }
  }

  static async getIllnessTypeById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const illnessType = await IllnessTypeModel.findById(+id)
      if (!illnessType) throw new NotFoundError("Illness Type not found")

      return json({ res, data: illnessType })
    } catch (error) {
      return next(error)
    }
  }

  static async createIllnessType(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, success } = IllnessTypeSchema.safeParse(req.body)
      if (!success) throw new BadRequestError("Invalid request data")

      const illnessType = await IllnessTypeModel.create({
        data
      })

      if (!illnessType) throw new BadRequestError("Failed to create Illness Type")

      return json({ res, data: illnessType, status: 201, message: "Illness Type created successfully" })
    } catch (error) {
      return next(error)
    }
  }

  static async updateIllnessType(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, success } = IllnessTypeSchema.safeParse(req.body)
      if (!success) throw new BadRequestError("Invalid request data")

      const { id } = req.params
      const illnessType = await IllnessTypeModel.findById(+id)

      if (!illnessType) throw new NotFoundError("Illness Type not found")

      const updatedIllnessType = await IllnessTypeModel.update(illnessType.id, data)

      return json({ res, data: updatedIllnessType, message: "Illness Type updated successfully" })
    } catch (error) {
      return next(error)
    }
  }
}
