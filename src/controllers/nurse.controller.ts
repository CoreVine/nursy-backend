import { json } from "../lib/helpers"

import { BadRequestError, NotFoundError, UnauthorizedError } from "../errors"
import { NextFunction, Request, Response } from "express"
import { OrderStatus } from "@prisma/client"
import { OrderModel } from "../data-access/order"

import db from "../services/prisma.service"

class NurseController {
  static async getRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await OrderModel.paginate({
        page: req.query.page ? Number(req.query.page) : 1,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : 10,
        where: {
          nurseId: req.user?.id,
          status: { in: [OrderStatus.Completed] }
        },
        include: {
          service: true,
          specificService: true,
          nurse: {
            select: {
              id: true,
              username: true,
              email: true,
              phoneNumber: true,
              isVerified: true
            }
          }
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
        where: { id: orderId, userId: req.user?.id },
        include: {
          service: true,
          nurse: {
            select: {
              id: true,
              username: true,
              email: true,
              phoneNumber: true,
              isVerified: true
            }
          }
        }
      })

      if (!request) throw new NotFoundError("Request not found")
      if (request.userId !== req.user?.id) throw new UnauthorizedError("You are not authorized to view this request")

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
}

export default NurseController
