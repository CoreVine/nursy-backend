import db from "../services/prisma.service"

import { userSelector } from "../config/db-selectors.config"
import { json } from "../lib/helpers"

import { BadRequestError, NotFoundError, UnauthorizedError } from "../errors"
import { NextFunction, Request, Response } from "express"
import { OrderStatus } from "@prisma/client"
import { OrderModel } from "../data-access/order"

class NurseController {
  static async getRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.query
      if (status && !Object.values(OrderStatus).includes(status as OrderStatus)) throw new BadRequestError("Invalid status provided")

      const requests = await OrderModel.paginate({
        page: req.query.page ? Number(req.query.page) : 1,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : 10,
        where: {
          nurseId: req.user?.id,
          status: !status ? undefined : (status as OrderStatus)
        },
        orderBy: { id: "desc" },
        include: {
          service: true,
          illnessType: true,
          payment: true,
          specificService: true,
          nurse: userSelector(),
          user: userSelector()
        }
      })

      return json({
        message: "Requests retrieved successfully",
        data: requests,
        status: 200,
        res
      })
    } catch (error) {
      next(error)
    }
  }

  static async getRequestById(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = +req.params.orderId
      if (isNaN(orderId) || orderId <= 0) throw new BadRequestError("Invalid order ID")

      const request = await db.order.findUnique({
        where: { id: orderId, nurseId: req.user?.id },
        include: {
          service: true,
          illnessType: true,
          payment: true,
          specificService: true,
          nurse: userSelector(),
          user: userSelector()
        }
      })

      if (!request) throw new NotFoundError("Request not found")
      if (request.nurseId !== req.user?.id) throw new UnauthorizedError("You are not authorized to view this request")

      return json({
        message: "Request retrieved successfully",
        data: request,
        status: 200,
        res
      })
    } catch (error) {
      next(error)
    }
  }

  static async hasPendingRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const pendingRequest = await db.order.findFirst({
        where: {
          nurseId: req.user?.id,
          status: { in: [OrderStatus.Pending, OrderStatus.Stale, OrderStatus.Accepted] }
        },
        include: {
          user: userSelector(),
          nurse: userSelector(),
          service: true,
          illnessType: true,
          payment: true,
          specificService: true
        }
      })

      return json({
        message: "Pending request",
        data: { hasPendingRequest: !!pendingRequest, request: pendingRequest },
        status: 200,
        res
      })
    } catch (error) {
      next(error)
    }
  }
}

export default NurseController
