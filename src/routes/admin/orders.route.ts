import AdminOrdersController from "../../controllers/admin/orders.controller"
import z from "zod"

import { Router } from "express"

import { isAuthenticatedAdminMiddleware } from "../../middleware/auth.middleware"
import { validateParams, validateQueryParams } from "../../middleware/validate.middleware"

const adminOrdersRouter = Router()

adminOrdersRouter.get(
  "/",
  isAuthenticatedAdminMiddleware,
  validateQueryParams(
    z.object({
      page: z.number().transform(Number).default(1).optional(),
      limit: z.number().transform(Number).default(10).optional(),
      search: z.string().max(255).default("").optional(),
      orderType: z.enum(["asc", "desc"]).default("desc").optional(),
      orderBy: z.enum(["createdAt", "updatedAt", "id", "username"]).default("id").optional()
    })
  ),
  AdminOrdersController.getOrders
)

adminOrdersRouter.get(
  "/:orderId",
  isAuthenticatedAdminMiddleware,
  validateParams(
    z.object({
      orderId: z.number().transform(Number)
    })
  ),
  AdminOrdersController.getOrder
)

export default adminOrdersRouter
