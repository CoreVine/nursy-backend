import { json } from "../lib/helpers"

import { BadRequestError, NotFoundError } from "../errors"
import { Request, Response } from "express"
import { OrderStatusList } from "../lib/type-lists"
import { OrderStatus } from "@prisma/client"
import { OrderModel } from "../data-access/order"

class NurseController {
  static async getNurseRequests(req: Request, res: Response) {
    const { page = 1, pageSize = 10 } = req.query

    const pageNumber = parseInt(page as string, 10)
    const pageSizeNumber = parseInt(pageSize as string, 10)

    const orders = await OrderModel.paginate({
      page: pageNumber,
      pageSize: pageSizeNumber,
      include: {
        user: { select: { id: true, username: true, email: true, phoneNumber: true, isVerified: true } }
      },
      where: {
        status: OrderStatus.Pending
      }
    })

    return json({
      message: "Nurse requests fetched successfully",
      status: 200,
      data: orders,
      res
    })
  }

  static async changeRequestStatus(req: Request, res: Response) {
    const { orderId } = req.params
    const { status } = req.body

    if (isNaN(+orderId)) throw new BadRequestError("Invalid order ID provided, must be a number")

    const order = await OrderModel.findById(+orderId)

    if (!status) throw new BadRequestError("Order ID and status are required")
    if (!order) throw new NotFoundError("Order not found")
    if (!OrderStatusList.includes(status)) throw new BadRequestError(`Invalid order status provided, Allowed values are: ${OrderStatusList.join(", ")}`)
    if (order.status !== OrderStatus.Pending) throw new BadRequestError("Order status is not pending, cannot reverse status from Accepted or Rejected")

    const updatedOrder = await OrderModel.update(+orderId, {
      status: status as OrderStatus
    })

    if (!updatedOrder) throw new BadRequestError("Failed to update order status")

    return json({
      message: "Order status updated successfully",
      status: 200,
      data: updatedOrder,
      res
    })
  }

  static async getNurseRequestsById(req: Request, res: Response) {
    const { orderId } = req.params

    if (isNaN(+orderId)) throw new BadRequestError("Invalid order ID provided, must be a number")

    const order = await OrderModel.findById(+orderId, {
      user: { id: true }
    })

    if (!order) throw new NotFoundError("Order not found")
    if (order?.nurseId != req.user?.id) throw new BadRequestError("You are not authorized to view this order")

    return json({
      message: "Request details",
      status: 200,
      data: order,
      res
    })
  }
}

export default NurseController
