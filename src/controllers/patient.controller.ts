import { json } from "../lib/helpers"

import { BadRequestError, NotFoundError, UnauthorizedError } from "../errors"
import { NextFunction, Request, Response } from "express"
import { OrderStatus } from "@prisma/client"
import { OrderModel } from "../data-access/order"

import db from "../services/prisma.service"
import { userSelector } from "../config/db-selectors.config"

class PatientController {
  static async getRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.query

      const requests = await OrderModel.paginate({
        page: req.query.page ? Number(req.query.page) : 1,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : 10,
        where: {
          userId: req.user?.id,
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
        where: { id: orderId, userId: req.user?.id },
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

export default PatientController
