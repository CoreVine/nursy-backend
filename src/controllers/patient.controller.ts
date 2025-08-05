import { json } from "../lib/helpers"

import { BadRequestError, NotFoundError, UnauthorizedError } from "../errors"
import { NextFunction, Request, Response } from "express"
import { OrderStatus, TimeType, UserType } from "@prisma/client"
import { CreateRequestPaymentSchema, CreateRequestSchema } from "../routes/patient.route"
import { OrderStatusList } from "../lib/type-lists"
import { OrderModel } from "../data-access/order"

import db from "../services/prisma.service"

class PatientController {
  static async createRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, success } = CreateRequestSchema.safeParse(req.body)
      if (!success) throw new BadRequestError("Invalid request data")

      const isNurseExists = await db.user.findUnique({
        where: { id: data.nurseId, type: UserType.Nurse },
        select: { id: true }
      })
      const isServiceExists = await db.service.findUnique({
        where: { id: data.serviceId },
        select: { id: true }
      })

      if (!isNurseExists) throw new NotFoundError("Nurse not found")
      if (!isServiceExists) throw new NotFoundError("Service not found")

      let date = data.date
      let time = `1970-01-01T${data.time}Z`

      if (data.type === TimeType.OnSpot) {
        if (data.date || data.time) throw new BadRequestError("Invalid Values, Once the type is OnSpot, date and time should not be provided")
        date = new Date().toISOString().split("T")[0]
        time = `1970-01-01T${new Date().toISOString().split("T")[1]}Z`
      }

      if (data.type === TimeType.Scheduled) {
        if (!data.date || !data.time) throw new BadRequestError("Date and time are required for scheduled requests")
      }

      return json({
        message: "Request created successfully",
        data: {},
        status: 201,
        res
      })
    } catch (error) {
      next(error)
    }
  }

  static async getRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { status = "Pending" } = req.query
      if (!OrderStatusList.includes(status as OrderStatus)) throw new BadRequestError("Invalid status provided")

      const requests = await OrderModel.paginate({
        page: req.query.page ? Number(req.query.page) : 1,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : 10,
        where: {
          userId: req.user?.id,
          status: (req.query.status as OrderStatus) || "Pending"
        },
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

  static async initializePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = +req.params.orderId
      if (isNaN(orderId) || orderId <= 0) throw new BadRequestError("Invalid order ID")

      const { data, success } = CreateRequestPaymentSchema.safeParse(req.body)
      if (!success) throw new BadRequestError("Invalid payment data")

      const request = await db.order.findUnique({
        where: { id: orderId, userId: req.user?.id },
        include: {
          service: true
        }
      })

      if (!request) throw new NotFoundError("Request not found")
      if (request.status !== OrderStatus.Pending) throw new BadRequestError("Only pending requests can be paid")

      const newPayment = await db.orderPayment.create({
        data: {
          orderId,
          userId: req.user?.id,
          totalHours: data.totalHours,
          totalAmount: +request.service.hourlyFees * data.totalHours
        }
      })

      return json({
        message: "Payment initialized successfully",
        data: newPayment,
        status: 200,
        res
      })
    } catch (error) {
      next(error)
    }
  }
}

export default PatientController
