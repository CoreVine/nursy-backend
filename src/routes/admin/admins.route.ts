import { UserType } from "@prisma/client"
import { Router } from "express"

import { validateBody, validateParams, validateQueryParams } from "../../middleware/validate.middleware"
import { isAuthenticatedAdminMiddleware } from "../../middleware/auth.middleware"

import AdminsController from "../../controllers/admin/admins.controller"
import z from "zod"

export const CreateAdminSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().max(255),
  password: z.string().min(6).max(255)
})

export const UpdateAdminSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().max(255)
})

const adminsRouter = Router()

adminsRouter.get(
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
  AdminsController.getAdmins
)

adminsRouter.post("/", isAuthenticatedAdminMiddleware, validateBody(CreateAdminSchema), AdminsController.createAdmin)
adminsRouter.patch(
  "/:adminId",
  isAuthenticatedAdminMiddleware,
  validateParams(
    z.object({
      adminId: z.number().transform(Number)
    })
  ),
  validateBody(UpdateAdminSchema),
  AdminsController.updateAdmin
)
adminsRouter.delete(
  "/:adminId",
  isAuthenticatedAdminMiddleware,
  validateParams(
    z.object({
      adminId: z.number().transform(Number)
    })
  ),
  AdminsController.deleteAdmin
)

adminsRouter.get(
  "/:adminId",
  isAuthenticatedAdminMiddleware,
  validateParams(
    z.object({
      adminId: z.number().transform(Number)
    })
  ),
  AdminsController.getAdminById
)

export default adminsRouter
