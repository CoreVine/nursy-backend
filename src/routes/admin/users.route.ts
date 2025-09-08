import { Router } from "express"
import z from "zod"

import AdminUsersController from "../../controllers/admin/users.controller"
import { isAuthenticatedAdminMiddleware } from "../../middleware/auth.middleware"
import { validateParams, validateQueryParams } from "../../middleware/validate.middleware"
import { UserType } from "@prisma/client"

const adminUsersRouter = Router()

adminUsersRouter.get(
  "/",
  isAuthenticatedAdminMiddleware,
  validateQueryParams(
    z.object({
      page: z.number().transform(Number).default(1).optional(),
      limit: z.number().transform(Number).default(10).optional(),
      type: z.enum(["all", UserType.Nurse, UserType.Custodian, UserType.Patient]).default("all").optional(),
      search: z.string().max(255).default("").optional(),
      orderType: z.enum(["asc", "desc"]).default("desc").optional(),
      orderBy: z.enum(["createdAt", "updatedAt", "id", "username"]).default("id").optional()
    })
  ),
  AdminUsersController.getUsers
)

adminUsersRouter.get(
  "/:userId",
  isAuthenticatedAdminMiddleware,
  validateParams(
    z.object({
      userId: z.number().transform(Number)
    })
  ),
  AdminUsersController.getUserById
)

adminUsersRouter.get(
  "/:userId/counts",
  isAuthenticatedAdminMiddleware,
  validateParams(
    z.object({
      userId: z.number().transform(Number)
    })
  ),
  AdminUsersController.getUserStatistics
)

adminUsersRouter.get(
  "/:userId/payments",
  isAuthenticatedAdminMiddleware,
  validateParams(
    z.object({
      userId: z.number().transform(Number)
    })
  ),
  AdminUsersController.getUserPayments
)

adminUsersRouter.get(
  "/:userId/payments/:paymentId",
  isAuthenticatedAdminMiddleware,
  validateParams(
    z.object({
      userId: z.number().transform(Number),
      paymentId: z.number().transform(Number)
    })
  ),
  AdminUsersController.getUserPayment
)

adminUsersRouter.get(
  "/:userId/orders",
  isAuthenticatedAdminMiddleware,
  validateParams(
    z.object({
      userId: z.number().transform(Number)
    })
  ),
  validateQueryParams(
    z.object({
      page: z.number().transform(Number).default(1).optional(),
      limit: z.number().transform(Number).default(10).optional(),
      search: z.string().max(255).default("").optional(),
      orderType: z.enum(["asc", "desc"]).default("desc").optional(),
      orderBy: z.enum(["createdAt", "updatedAt", "id", "username"]).default("id").optional()
    })
  ),
  AdminUsersController.getUserOrders
)

adminUsersRouter.get(
  "/:userId/orders/:orderId",
  isAuthenticatedAdminMiddleware,
  validateParams(
    z.object({
      userId: z.number().transform(Number),
      orderId: z.number().transform(Number)
    })
  ),

  AdminUsersController.getUserOrder
)

export default adminUsersRouter
