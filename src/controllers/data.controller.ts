import { json } from "../lib/helpers"

import { NextFunction, Request, Response } from "express"
import { BadRequestError, NotFoundError } from "../errors"
import { OrderStatusList } from "../lib/type-lists"
import { OrderStatus } from "@prisma/client"
import { OrderModel } from "../data-access/order"
import { TRequest } from "../types"
import { ChatModel } from "../data-access/chat"
import db from "../services/prisma.service"

class DataController {
  static async getServices(req: Request, res: Response, next: NextFunction) {
    try {
      const { search } = req.query
      const services = await db.service.findMany({
        where: { name: { contains: (search as string) || "" } },
        orderBy: { name: "asc" }
      })
      return json({
        message: "Services fetched successfully",
        data: services,
        status: 200,
        res
      })
    } catch (error) {
      return next(error)
    }
  }
  static async getServiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      if (!id) throw new BadRequestError("Service ID is required")
      if (isNaN(Number(id))) throw new BadRequestError("Service ID must be a number")

      const service = await db.service.findUnique({
        where: { id: Number(id) }
      })

      if (!service) throw new NotFoundError("Service not found")

      return json({
        message: "Service fetched successfully",
        data: service,
        status: 200,
        res
      })
    } catch (error) {
      return next(error)
    }
  }

  static async getSpecificServices(req: Request, res: Response, next: NextFunction) {
    try {
      const { search } = req.query
      const specificServices = await db.specificService.findMany({
        where: { name: { contains: (search as string) || "" } },
        orderBy: { name: "asc" }
      })
      return json({
        message: "Specific services fetched successfully",
        data: specificServices,
        status: 200,
        res
      })
    } catch (error) {
      return next(error)
    }
  }
  static async getSpecificServiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      if (!id) throw new BadRequestError("Specific Service ID is required")
      if (isNaN(Number(id))) throw new BadRequestError("Specific Service ID must be a number")

      const specificService = await db.specificService.findUnique({
        where: { id: Number(id) }
      })

      if (!specificService) throw new NotFoundError("Specific service not found")

      return json({
        message: "Specific service fetched successfully",
        data: specificService,
        status: 200,
        res
      })
    } catch (error) {
      return next(error)
    }
  }

  static async getIllnessTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const { search } = req.query
      const illnessTypes = await db.illnessType.findMany({
        where: { name: { contains: (search as string) || "" } },
        orderBy: { name: "asc" }
      })
      return json({
        message: "Illness types fetched successfully",
        data: illnessTypes,
        status: 200,
        res
      })
    } catch (error) {
      return next(error)
    }
  }
  static async getIllnessTypeById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      if (!id) throw new BadRequestError("Illness Type ID is required")
      if (isNaN(Number(id))) throw new BadRequestError("Illness Type ID must be a number")

      const illnessType = await db.illnessType.findUnique({
        where: { id: Number(id) }
      })

      if (!illnessType) throw new NotFoundError("Illness type not found")

      return json({
        message: "Illness type fetched successfully",
        data: illnessType,
        status: 200,
        res
      })
    } catch (error) {
      return next(error)
    }
  }
}

export default DataController
