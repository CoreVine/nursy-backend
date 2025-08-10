import logger from "../../lib/logger"
import db from "../../services/prisma.service"
import z from "zod"

import { NotFoundError, ForbiddenError, ValidationError, BadRequestError } from "../../errors"
import { OrderStatus, PaymentType, TimeType, UserType } from "@prisma/client"
import { getDistanceFromLatLonInKm, toSocketError } from "../../lib/utils"
import { Socket, Server as SocketIOServer } from "socket.io"
import { BaseSocketController } from "./base.socket.controller"
import { KashierService } from "../../services/kashier.service"

const CreateOrderSchema = z.object({
  serviceId: z.number().int().positive(),
  illnessTypeId: z.number().int().positive(),
  specificServiceId: z.number().int().positive().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  employmentType: z.string().min(1, "Employment type is required"),
  type: z.enum([TimeType.OnSpot, TimeType.Scheduled], { message: "OnSpot, Scheduled, only valid values" }),
  paymentType: z.enum([PaymentType.Hourly, PaymentType.Services], { message: "Hourly, Services, only valid values" }),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  additionalInformation: z.string().optional(),
  date: z.coerce.date().optional(),

  gender: z.enum(["Male", "Female"], { message: "Male, Female, only valid values" }),
  age: z.number().positive()
})

type CreateOrderPayload = z.infer<typeof CreateOrderSchema>
type AcceptRequestPayload = {
  orderId: number
}
type InitPaymentPayload = {
  orderId: number
  totalHours: number
}

class RequestsSocketController extends BaseSocketController {
  static async handleConnection(socket: Socket, io: SocketIOServer) {
    logger.info(`[RequestsSocketController]: Client connected: ${socket.id}`)

    socket.on("requests.search", async () => {
      try {
        const fetchedRequests = await this.fetchNearbyRequestsForNurse(socket)
        socket.emit("requests.fetched", { success: true, data: fetchedRequests })
      } catch (err) {
        logger.error(`[RequestsSocketController]: Error fetching requests:`, err)
        socket.emit("requests.fetched", { success: false, error: toSocketError(err) })
      }
    })

    socket.on("requests.accept", async (payload: AcceptRequestPayload) => {
      try {
        const data = await this.handleAcceptRequestByNurse(socket, payload)
        socket.emit("requests.accepted", { success: true, data })
        socket.join(`requests.rooms.${data.id}`)
        socket.to(`requests.rooms.${data.id}`).emit("requests.currentPatientRequest", { success: true, data })
      } catch (err) {
        logger.error(`[RequestsSocketController]: Error accepting request:`, err)
        socket.emit("requests.accepted", { success: false, error: toSocketError(err) })
      }
    })

    socket.on("requests.create", async (payload: CreateOrderPayload) => {
      try {
        const data = await this.createOrderByPatient(socket, payload)
        socket.join(`requests.rooms.${data.id}`)
        socket.emit("requests.created", { success: true, data })
      } catch (err) {
        logger.error(`[RequestsSocketController]: Error creating order:`, err)
        socket.emit("requests.created", { success: false, error: toSocketError(err) })
      }
    })

    socket.on("requests.initPayment", async (payload: InitPaymentPayload) => {
      try {
        const paymentData = await this.initPayment(socket, payload)
        socket.emit("requests.paymentInitialized", { success: true, data: paymentData })
      } catch (err) {
        logger.error(`[RequestsSocketController]: Error initializing payment:`, err)
        socket.emit("requests.paymentInitialized", { success: false, error: toSocketError(err) })
      }
    })
  }

  static async createOrderByPatient(socket: Socket, payload: CreateOrderPayload) {
    const reqUser = await this.getUserFromSocket(socket)
    const user = await db.user.findUnique({ where: { id: reqUser.id } })

    if (!user) throw new NotFoundError("User not found")
    if (user.type !== UserType.Patient) throw new ForbiddenError("User is not a patient")

    const parsed = CreateOrderSchema.safeParse(payload)
    if (!parsed.success) throw new ValidationError("Validation failed", parsed.error)

    let data = parsed.data
    let date: Date | null = null

    const inProgressOrderExists = await db.inProgressOrder.findFirst({
      where: { userId: user.id, status: OrderStatus.InProgress }
    })

    if (inProgressOrderExists) throw new BadRequestError("You already have an in-progress order")

    if (data.type === TimeType.Scheduled) {
      if (!data.date) throw new BadRequestError("Date is required for scheduled requests")
      date = new Date(data.date)
    }

    if (data.paymentType === PaymentType.Hourly && data.specificServiceId) throw new BadRequestError("Specific service cannot be used with hourly payment type")
    if (data.paymentType === PaymentType.Services && !data.specificServiceId) throw new BadRequestError("Specific service is required for services payment type")

    const order = await db.order.create({
      data: { ...data, userId: user.id, date },
      include: { user: { select: { id: true, username: true, phoneNumber: true, email: true, isVerified: true } }, nurse: { select: { id: true, username: true, phoneNumber: true, email: true, isVerified: true } } }
    })

    logger.info(`[RequestsSocketController]: Order created by PatientID ${user.id} with OrderID ${order.id}`)

    return order
  }

  static async fetchNearbyRequestsForNurse(socket: Socket) {
    const payload = await this.getUserFromSocket(socket)
    const nurse = await db.user.findUnique({ where: { id: payload.id } })

    if (!nurse) throw new NotFoundError("Nurse not found")
    if (nurse.latitude == null || nurse.longitude == null) throw new BadRequestError("Nurse location is missing")
    if (nurse.type !== UserType.Nurse) throw new ForbiddenError("User is not a nurse")

    const requests = await db.order.findMany({
      include: { user: { select: { id: true, username: true, phoneNumber: true, email: true, isVerified: true } } },
      where: { nurseId: null, status: OrderStatus.Pending }
    })

    const nearbyRequests = requests.filter((single) => {
      if (single.latitude == null || single.longitude == null) return false
      const dist = getDistanceFromLatLonInKm(nurse.latitude!, nurse.longitude!, single.latitude, single.longitude)
      return dist <= 20
    })

    return nearbyRequests
  }

  static async handleAcceptRequestByNurse(socket: Socket, payload: AcceptRequestPayload) {
    const order = await db.order.findUnique({
      where: { id: payload.orderId },
      include: { user: { select: { id: true, username: true, phoneNumber: true, email: true, isVerified: true } }, nurse: { select: { id: true, username: true, phoneNumber: true, email: true, isVerified: true } } }
    })
    if (!order) throw new NotFoundError("Order not found")

    const nurse = await this.getUserFromSocket(socket)
    const user = await db.user.findUnique({ where: { id: nurse.id } })

    if (user?.type !== UserType.Nurse) throw new ForbiddenError("User is not a nurse")
    if (order.nurseId) throw new ForbiddenError("Order is already accepted by another nurse")
    if (order.status !== OrderStatus.Pending) throw new BadRequestError("Order is not in pending status")

    const updatedOrder = await db.order.update({
      where: { id: order.id },
      data: { nurseId: nurse.id, status: OrderStatus.Accepted },
      include: { user: { select: { id: true, username: true, phoneNumber: true, email: true, isVerified: true } }, nurse: { select: { id: true, username: true, phoneNumber: true, email: true, isVerified: true } } }
    })

    const inProgressOrder = await db.inProgressOrder.create({
      data: {
        orderId: updatedOrder.id,
        userId: order.userId,
        status: OrderStatus.InProgress
      }
    })

    logger.info(`[RequestsSocketController]: NurseID ${nurse?.id} accepted order ${order.id}`)

    return updatedOrder
  }

  static async initPayment(socket: Socket, payload: InitPaymentPayload) {
    const order = await db.order.findUnique({
      where: { id: payload.orderId },
      include: { user: true }
    })

    if (!order) throw new NotFoundError("Order not found")
    if (order.status !== OrderStatus.Accepted) throw new BadRequestError("Order is not in accepted status")

    const reqUser = await this.getUserFromSocket(socket)
    const user = await db.user.findUnique({ where: { id: reqUser.id } })

    if (order.userId !== reqUser.id) throw new ForbiddenError("You are not the owner of this order")
    if (user?.type !== UserType.Patient) throw new ForbiddenError("User is not a patient")

    let kashier = new KashierService()
    let totalAmount = 0
    let hourRate = 10

    if (order.specificServiceId) {
      const service = await db.specificService.findUnique({
        where: { id: order.specificServiceId },
        select: { price: true }
      })
      if (!service) throw new NotFoundError("Specific service not found")
      totalAmount = Number(service.price)
    } else if (order.paymentType === PaymentType.Hourly) {
      totalAmount = hourRate * (payload.totalHours || 1)
    } else {
      throw new BadRequestError("Invalid payment type for order")
    }

    const payment = kashier.initializePayment({
      amount: totalAmount,
      currency: "EGP",
      id: order.id
    })

    const findPayment = await db.orderPayment.findFirst({
      where: { orderId: order.id, userId: user.id, status: OrderStatus.Pending }
    })

    if (findPayment) {
      throw new BadRequestError("Payment already initialized for this order")
    }

    const orderPayment = await db.orderPayment.create({
      data: {
        orderId: order.id,
        userId: user.id,
        totalAmount: totalAmount,
        totalHours: payload.totalHours,
        paymentMethod: "card",
        paymentUrl: payment.payment_url,
        status: OrderStatus.Pending
      }
    })

    return orderPayment
  }
}

export default RequestsSocketController
