import { json } from "../../lib/helpers"

import { NextFunction, Request, Response } from "express"
import { BadRequestError, NotFoundError } from "../../errors"
import { ServiceModel } from "../../data-access/service"
import { ServiceSchema } from "../../routes/admin/services.route"
import { Prisma } from "@prisma/client"

export default class ServicesController {
  static async getServices(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, search, orderBy = "id", orderType = "desc" } = req.query

      const services = await ServiceModel.paginate({
        page: Number(page),
        take: Number(limit),
        orderBy: { [orderBy as string]: orderType },
        select: {
          id: true,
          name: true,
          hourlyFees: true,
          salary: true,
          status: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { specificServices: true } }
        },
        where: {
          name: search ? { contains: String(search) } : undefined
        }
      })

      return json({ res, data: services })
    } catch (error) {
      return next(error)
    }
  }

  static async getServiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const { serviceId } = req.params
      const service = await ServiceModel.findById(+serviceId)
      if (!service) throw new NotFoundError("service not found")

      return json({ res, data: service })
    } catch (error) {
      return next(error)
    }
  }

  static async createService(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, success } = ServiceSchema.safeParse(req.body)
      if (!success) throw new BadRequestError("Invalid request data")

      const service = await ServiceModel.create({
        data
      })

      if (!service) throw new BadRequestError("Failed to create service")

      return json({ res, data: service, status: 201, message: "Service created successfully" })
    } catch (error) {
      return next(error)
    }
  }

  static async updateService(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, success } = ServiceSchema.safeParse(req.body)
      if (!success) throw new BadRequestError("Invalid request data")

      const { serviceId } = req.params
      const service = await ServiceModel.findById(+serviceId)

      if (!service) throw new NotFoundError("Service not found")

      const updatedService = await ServiceModel.update(service.id, data)

      return json({ res, data: updatedService, message: "Service updated successfully" })
    } catch (error) {
      return next(error)
    }
  }
}
