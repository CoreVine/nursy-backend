import { Router } from "express"
import z from "zod"

import AdminUsersController from "../../controllers/admin/users.controller"
import { isAuthenticatedAdminMiddleware } from "../../middleware/auth.middleware"
import { validateQueryParams } from "../../middleware/validate.middleware"
import { UserType } from "@prisma/client"

const adminUsersRouter = Router()

adminUsersRouter.get(
  "/",
  isAuthenticatedAdminMiddleware,
  validateQueryParams(
    z.object({
      page: z.string().regex(/^\d+$/).transform(Number).default("1").optional(),
      limit: z.string().regex(/^\d+$/).transform(Number).default("10").optional(),
      type: z.enum(["all", UserType.Nurse, UserType.Custodian, UserType.Patient]).default("all").optional(),
      search: z.string().max(255).default("").optional(),
      orderType: z.enum(["asc", "desc"]).default("desc").optional(),
      orderBy: z.enum(["createdAt", "updatedAt", "id", "username"]).default("id").optional()
    })
  ),
  AdminUsersController.getUsers
)

export default adminUsersRouter
