import { json } from "../../lib/helpers"

import { NextFunction, Request, Response } from "express"
import { BadRequestError, NotFoundError } from "../../errors"
import { SpecificServiceSchema } from "../../routes/admin/specific-services.route"
import { SpecificServiceModel } from "../../data-access/specificService"

export default class SpecificServicesController {
  static async getSpecificServices(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, search, orderBy = "id", orderType = "desc" } = req.query

      const specificServices = await SpecificServiceModel.paginate({
        page: Number(page),
        take: Number(limit),
        orderBy: { [orderBy as string]: orderType },
        select: {
          id: true,
          name: true,
          price: true,
          status: true,
          serviceId: true,
          description: true,
          service: true,
          createdAt: true,
          updatedAt: true
        },
        where: {
          name: search ? { contains: String(search) } : undefined
        }
      })

      return json({ res, data: specificServices })
    } catch (error) {
      return next(error)
    }
  }

  static async getSpecificServiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const { serviceId } = req.params
      const service = await SpecificServiceModel.findById(+serviceId)
      if (!service) throw new NotFoundError("service not found")

      return json({ res, data: service })
    } catch (error) {
      return next(error)
    }
  }

  static async createSpecificService(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, success } = SpecificServiceSchema.safeParse(req.body)
      if (!success) throw new BadRequestError("Invalid request data")

      const service = await SpecificServiceModel.create({
        data
      })

      if (!service) throw new BadRequestError("Failed to create service")

      return json({ res, data: service, status: 201, message: "Service created successfully" })
    } catch (error) {
      return next(error)
    }
  }

  static async updateSpecificService(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, success } = SpecificServiceSchema.safeParse(req.body)
      if (!success) throw new BadRequestError("Invalid request data")

      const { serviceId } = req.params
      const service = await SpecificServiceModel.findById(+serviceId)

      if (!service) throw new NotFoundError("Service not found")

      const updatedService = await SpecificServiceModel.update(service.id, data)

      return json({ res, data: updatedService, message: "Service updated successfully" })
    } catch (error) {
      return next(error)
    }
  }
}
