import { Router } from "express"

import { validateBody, validateParams, validateQueryParams } from "../../middleware/validate.middleware"
import { isAuthenticatedAdminMiddleware } from "../../middleware/auth.middleware"

import ServiceController from "../../controllers/admin/services.controller"
import z from "zod"

export const ServiceSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().max(255),
  salary: z.coerce.number().min(0),
  hourlyFees: z.coerce.number().min(0),
  status: z.boolean().default(true).optional()
})

const servicesRouter = Router()

servicesRouter.get(
  "/",
  isAuthenticatedAdminMiddleware,
  validateQueryParams(
    z.object({
      page: z.number().transform(Number).default(1).optional(),
      limit: z.number().transform(Number).default(10).optional(),
      search: z.string().max(255).default("").optional(),
      orderType: z.enum(["asc", "desc"]).default("desc").optional(),
      orderBy: z.enum(["createdAt", "updatedAt", "id", "name"]).default("id").optional()
    })
  ),
  ServiceController.getServices
)

servicesRouter.get(
  "/:serviceId",
  isAuthenticatedAdminMiddleware,
  validateParams(
    z.object({
      serviceId: z.number().transform(Number)
    })
  ),
  ServiceController.getServiceById
)

servicesRouter.post("/", isAuthenticatedAdminMiddleware, validateBody(ServiceSchema), ServiceController.createService)

servicesRouter.patch(
  "/:serviceId",
  isAuthenticatedAdminMiddleware,
  validateParams(
    z.object({
      serviceId: z.number().transform(Number)
    })
  ),
  validateBody(ServiceSchema),
  ServiceController.updateService
)

export default servicesRouter
