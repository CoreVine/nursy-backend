import { Router } from "express"
import z from "zod"

import AdminUsersController from "../../controllers/admin/users.controller"
import { isAuthenticatedAdminMiddleware } from "../../middleware/auth.middleware"
import { validateBody, validateParams, validateQueryParams } from "../../middleware/validate.middleware"
import { UserDataStatus, UserType } from "@prisma/client"

export const UpdateNurseWalletSchema = z.object({
  amount: z.number().default(0),
  type: z.enum(["Credit", "Debit"]),
  description: z.string().max(255).optional()
})

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
  "/pending",
  isAuthenticatedAdminMiddleware,
  validateQueryParams(
    z.object({
      page: z.number().transform(Number).default(1).optional(),
      limit: z.number().transform(Number).default(10).optional(),
      papersStatus: z.enum([UserDataStatus.Pending, UserDataStatus.Rejected]).default("Pending").optional(),
      search: z.string().max(255).default("").optional(),
      orderType: z.enum(["asc", "desc"]).default("desc").optional(),
      orderBy: z.enum(["createdAt", "updatedAt", "id", "username"]).default("id").optional()
    })
  ),
  AdminUsersController.getPendingNurses
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
  "/:userId/papers",
  isAuthenticatedAdminMiddleware,
  validateParams(
    z.object({
      userId: z.number().transform(Number)
    })
  ),
  AdminUsersController.getNursePapers
)

adminUsersRouter.patch(
  "/:userId/papers",
  isAuthenticatedAdminMiddleware,
  validateBody(
    z.object({
      status: z.enum([UserDataStatus.Approved, UserDataStatus.Rejected])
    })
  ),
  AdminUsersController.updateNursePapersStatus
)

adminUsersRouter.get("/:userId/wallet", isAuthenticatedAdminMiddleware, AdminUsersController.getNurseWallet)
adminUsersRouter.get("/:userId/wallet/history", isAuthenticatedAdminMiddleware, AdminUsersController.getNurseWalletHistory)
adminUsersRouter.get("/:userId/wallet/history/:historyId", isAuthenticatedAdminMiddleware, AdminUsersController.getNurseWalletHistoryItem)
adminUsersRouter.post("/:userId/wallet", isAuthenticatedAdminMiddleware, validateBody(UpdateNurseWalletSchema), AdminUsersController.updateNurseWallet)

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
