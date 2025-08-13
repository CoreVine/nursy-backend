import logger from "../../lib/logger"
import db from "../../services/prisma.service"
import z from "zod"

import { NotFoundError, ForbiddenError, ValidationError, BadRequestError, UnauthorizedError } from "../../errors"
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
type AcceptRequestPayload = { orderId: number }
type InitPaymentPayload = { orderId: number; totalHours: number }

class RequestsSocketController extends BaseSocketController {
  static async handleConnection(socket: Socket, io: SocketIOServer) {
    logger.info(`[RequestsSocketController]: Client connected: ${socket.id}`)

    // NURSE FLOW

    socket.on("requests.nurse.search", async () => {
      try {
        const fetchedRequests = await this.fetchNearbyRequestsForNurse(socket)
        io.emit("requests.nurse.fetched", { success: true, data: fetchedRequests })
      } catch (err) {
        logger.error(`[RequestsSocketController]: Error fetching requests:`, err)
        io.emit("requests.nurse.fetched", { success: false, error: toSocketError(err) })
      }
    })

    socket.on("requests.nurse.accept", async (payload: AcceptRequestPayload) => {
      try {
        console.dir(payload, { depth: null })
        const data = await this.handleAcceptRequestByNurse(socket, payload)
        socket.emit("requests.nurse.accepted", { success: true, data })
        socket.emit("requests.nurse.search")
        socket.join(`requests.rooms.${data.id}`)
        socket.to(`requests.rooms.${data.id}`).emit("requests.currentPatientRequest", { success: true, data })
      } catch (err) {
        logger.error(`[RequestsSocketController]: Error accepting request:`, err)
        socket.emit("requests.accepted", { success: false, error: toSocketError(err) })
      }
    })

    socket.on("requests.nurse.refuse", async (payload: AcceptRequestPayload) => {
      try {
        const data = await this.handleRefuseRequestByNurse(socket, payload)
        socket.emit("requests.nurse.search")
        socket.emit("requests.nurse.refused", { success: true, data })
        socket.leave(`requests.rooms.${data.id}`)
        socket.to(`requests.rooms.${data.id}`).emit("requests.currentPatientRequest", { success: true, data })
      } catch (err) {
        logger.error(`[RequestsSocketController]: Error refusing request:`, err)
        socket.emit("requests.nurse.search")
        socket.emit("requests.nurse.refused", { success: false, error: toSocketError(err) })
      }
    })

    // PATIENT FLOW

    socket.on("requests.patient.fetch", async () => {
      try {
        const fetchedRequests = await this.fetchRequestsForPatient(socket)
        socket.emit("requests.patient.fetched", { success: true, data: fetchedRequests })
      } catch (err) {
        logger.error(`[RequestsSocketController]: Error fetching requests for patient:`, err)
        socket.emit("requests.nurse.search")
        socket.emit("requests.patient.fetched", { success: false, error: toSocketError(err) })
      }
    })

    socket.on("requests.patient.create", async (payload: CreateOrderPayload) => {
      try {
        const data = await this.createOrderByPatient(socket, payload)
        socket.emit("requests.nurse.search")
        socket.join(`requests.rooms.${data.id}`)
        socket.emit("requests.patient.created", { success: true, data })
      } catch (err) {
        logger.error(`[RequestsSocketController]: Error creating order:`, err)
        socket.emit("requests.nurse.search")
        socket.emit("requests.patient.created", { success: false, error: toSocketError(err) })
      }
    })

    socket.on("requests.patient.accept", async (payload: AcceptRequestPayload) => {
      try {
        const data = await this.handleAcceptRequestByPatient(socket, payload)
        socket.emit("requests.nurse.search")
        socket.join(`requests.rooms.${data.id}`)
        socket.to(`requests.rooms.${data.id}`).emit("requests.patient.accepted", { success: true, data })
      } catch (err) {
        logger.error(`[RequestsSocketController]: Error accepting request by patient:`, err)
        socket.emit("requests.nurse.search")
        socket.emit("requests.patient.accepted", { success: false, error: toSocketError(err) })
      }
    })

    socket.on("requests.patient.refuse", async (payload: AcceptRequestPayload) => {
      try {
        const data = await this.handleRefuseRequestByPatient(socket, payload)
        socket.emit("requests.nurse.search")
        socket.to(`requests.rooms.${data.id}`).emit("requests.patient.refused", { success: true, data })
        socket.leave(`requests.rooms.${data.id}`)
      } catch (err) {
        logger.error(`[RequestsSocketController]: Error refusing request by patient:`, err)
        socket.emit("requests.nurse.search")
        socket.emit("requests.patient.refused", { success: false, error: toSocketError(err) })
      }
    })

    socket.on("requests.patient.payments.init", async (payload: InitPaymentPayload) => {
      try {
        const paymentData = await this.initPayment(socket, payload)
        socket.emit("requests.nurse.search")
        socket.emit("requests.patient.payments.initialized", { success: true, data: paymentData })
      } catch (err) {
        logger.error(`[RequestsSocketController]: Error initializing payment:`, err)
        socket.emit("requests.nurse.search")
        socket.emit("requests.patient.payments.initialized", { success: false, error: toSocketError(err) })
      }
    })

    socket.on("requests.patient.payments.fetch", async (orderId: number) => {
      try {
        const paymentData = await this.fetchPayment(socket, orderId)
        socket.emit("requests.nurse.search")
        socket.emit("requests.patient.payments.fetched", { success: true, data: paymentData })
      } catch (err) {
        logger.error(`[RequestsSocketController]: Error fetching payment:`, err)
        socket.emit("requests.nurse.search")
        socket.emit("requests.patient.payments.fetched", { success: false, error: toSocketError(err) })
      }
    })
  }

  static async createOrderByPatient(socket: Socket, payload: CreateOrderPayload) {
    const reqUser = await this.getUserFromSocket(socket)
    const user = await db.user.findUnique({ where: { id: reqUser.id } })

    if (!user) throw new NotFoundError("User not found")
    if (user.type !== UserType.Patient) throw new ForbiddenError("User is not a patient")

    const findPendingOrder = await db.order.findFirst({
      where: { userId: user.id, status: OrderStatus.Pending, nurseId: null }
    })

    //if (findPendingOrder) throw new BadRequestError("You already have a pending order")

    const parsed = CreateOrderSchema.safeParse(payload)
    if (!parsed.success) throw new ValidationError("Validation failed", parsed.error)

    let data = parsed.data
    let date: Date | null = null

    const inProgressOrderExists = await db.inProgressOrder.findFirst({
      where: { userId: user.id, status: OrderStatus.InProgress }
    })

    // if (inProgressOrderExists) throw new BadRequestError("You already have an in-progress order")

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

    const refusedOrders = await db.refusedOrder.findMany({
      where: { nurseId: nurse.id },
      select: { orderId: true }
    })

    const requests = await db.order.findMany({
      include: { user: { select: { id: true, username: true, phoneNumber: true, email: true, isVerified: true } } },
      where: {
        OR: [{ nurseId: null }, { nurseId: nurse.id }],
        AND: [{ id: { notIn: refusedOrders.map((ro) => ro.orderId) } }],
        status: { in: [OrderStatus.Pending, OrderStatus.Stale, OrderStatus.Completed, OrderStatus.Accepted] }
      }
    })

    const nearbyRequests = requests.filter((single) => {
      if (single.latitude == null || single.longitude == null) return false
      const dist = getDistanceFromLatLonInKm(nurse.latitude!, nurse.longitude!, single.latitude, single.longitude)
      return dist <= 20
    })

    return requests
  }

  static async fetchRequestsForPatient(socket: Socket) {
    const payload = await this.getUserFromSocket(socket)
    const user = await db.user.findUnique({ where: { id: payload.id } })

    if (!user) throw new NotFoundError("Nurse not found")

    const requests = await db.order.findMany({
      include: { user: { select: { id: true, username: true, phoneNumber: true, email: true, isVerified: true } } },
      where: {
        OR: [{ userId: user.id }],
        status: { in: [OrderStatus.Pending, OrderStatus.Stale, OrderStatus.Completed, OrderStatus.Accepted] }
      }
    })

    return requests
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
      data: { nurseId: nurse.id, status: OrderStatus.Stale },
      include: { user: { select: { id: true, username: true, phoneNumber: true, email: true, isVerified: true } }, nurse: { select: { id: true, username: true, phoneNumber: true, email: true, isVerified: true } } }
    })

    const inProgressOrder = await db.inProgressOrder.create({
      data: {
        orderId: updatedOrder.id,
        userId: order.userId,
        status: OrderStatus.InProgress
      }
    })

    logger.info(`[RequestsSocketController]: NurseID ${nurse?.id} staled order ${order.id}`)

    return updatedOrder
  }

  static async handleRefuseRequestByNurse(socket: Socket, payload: AcceptRequestPayload) {
    const order = await db.order.findUnique({
      where: { id: payload.orderId },
      include: { user: { select: { id: true, username: true, phoneNumber: true, email: true, isVerified: true } }, nurse: { select: { id: true, username: true, phoneNumber: true, email: true, isVerified: true } } }
    })

    const nurse = await this.getUserFromSocket(socket)
    const user = await db.user.findUnique({ where: { id: nurse.id } })

    if (!order) throw new NotFoundError("Order not found")
    if (user?.type !== UserType.Nurse) throw new ForbiddenError("User is not a nurse")
    if (order.status !== OrderStatus.Pending) throw new BadRequestError("Order is not in pending status to refuse")

    const updatedOrder = await db.order.update({
      where: { id: order?.id },
      data: { status: OrderStatus.Pending, nurseId: null },
      include: { user: { select: { id: true, username: true, phoneNumber: true, email: true, isVerified: true } }, nurse: { select: { id: true, username: true, phoneNumber: true, email: true, isVerified: true } } }
    })

    const refusedOrder = await db.refusedOrder.findFirst({
      where: { orderId: order.id, nurseId: nurse.id }
    })
    if (!refusedOrder) {
      await db.refusedOrder.create({
        data: {
          orderId: order.id,
          nurseId: nurse.id
        }
      })
    }

    logger.info(`[RequestsSocketController]: NurseID ${nurse?.id} refused order ${order.id}`)

    return updatedOrder
  }

  static async handleAcceptRequestByPatient(socket: Socket, payload: AcceptRequestPayload) {
    const order = await db.order.findUnique({
      where: { id: payload.orderId },
      include: { user: { select: { id: true, username: true, phoneNumber: true, email: true, isVerified: true } }, nurse: { select: { id: true, username: true, phoneNumber: true, email: true, isVerified: true } } }
    })
    if (!order) throw new NotFoundError("Order not found")

    const nurse = await this.getUserFromSocket(socket)
    const user = await db.user.findUnique({ where: { id: nurse.id } })

    if (user?.type !== UserType.Patient) throw new ForbiddenError("User is not a nurse")
    if (!order.nurseId) throw new ForbiddenError("Order is already accepted by another nurse")
    if (order.userId !== user?.id) throw new UnauthorizedError("This order doesn't blong to current logged in user.")
    if (order.status !== OrderStatus.Stale) throw new BadRequestError("Order is not in stale status to accept by patient")

    const updatedOrder = await db.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.Accepted },
      include: { user: { select: { id: true, username: true, phoneNumber: true, email: true, isVerified: true } }, nurse: { select: { id: true, username: true, phoneNumber: true, email: true, isVerified: true } } }
    })

    logger.info(`[RequestsSocketController]: NurseID ${nurse?.id} accepted order ${order.id}`)

    return updatedOrder
  }

  static async handleRefuseRequestByPatient(socket: Socket, payload: AcceptRequestPayload) {
    const order = await db.order.findUnique({
      where: { id: payload.orderId },
      include: { user: { select: { id: true, username: true, phoneNumber: true, email: true, isVerified: true } }, nurse: { select: { id: true, username: true, phoneNumber: true, email: true, isVerified: true } } }
    })

    const user = await this.getUserFromSocket(socket)

    if (!order) throw new NotFoundError("Order not found")
    if (order.userId !== user?.id) throw new UnauthorizedError("This order doesn't belong to current logged in user.")
    if (order.status !== OrderStatus.Stale) throw new BadRequestError("Order is not in stale status to refuse")
    if (!order.nurseId) throw new BadRequestError("Order is not accepted by any nurse")

    const updatedOrder = await db.order.update({
      where: { id: order?.id },
      data: { status: OrderStatus.Pending, nurseId: null },
      include: { user: { select: { id: true, username: true, phoneNumber: true, email: true, isVerified: true } }, nurse: { select: { id: true, username: true, phoneNumber: true, email: true, isVerified: true } } }
    })

    const refusedOrder = await db.refusedOrder.upsert({
      where: { orderId: order.id, nurseId: order.nurseId },
      create: {
        orderId: order.id,
        nurseId: order.nurseId
      },
      update: {
        orderId: order.id,
        nurseId: order.nurseId
      }
    })

    logger.info(`[RequestsSocketController]: PatientID ${user?.id} refused order ${order.id}`)

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

    if (findPayment) return findPayment

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

  static async fetchPayment(socket: Socket, orderId: number) {
    const reqUser = await this.getUserFromSocket(socket)
    const user = await db.user.findUnique({ where: { id: reqUser.id } })

    if (!user) throw new NotFoundError("User not found")

    const payment = await db.orderPayment.findUnique({
      where: { orderId },
      include: { order: true }
    })

    if (!payment) throw new NotFoundError("Payment not found for this order")

    return payment
  }
}

export default RequestsSocketController
