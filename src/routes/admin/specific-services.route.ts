import { Router } from "express"

import { validateBody, validateParams, validateQueryParams } from "../../middleware/validate.middleware"
import { isAuthenticatedAdminMiddleware } from "../../middleware/auth.middleware"

import SpecificServiceController from "../../controllers/admin/specific-services.controller"
import z from "zod"

export const SpecificServiceSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().max(255),
  price: z.coerce.number().min(0),
  serviceId: z.number().min(0),
  status: z.boolean().default(true).optional()
})

const specificServiceRouter = Router()

specificServiceRouter.get(
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
  SpecificServiceController.getSpecificServices
)

specificServiceRouter.get(
  "/:serviceId",
  isAuthenticatedAdminMiddleware,
  validateParams(
    z.object({
      serviceId: z.number().transform(Number)
    })
  ),
  SpecificServiceController.getSpecificServiceById
)

specificServiceRouter.post("/", isAuthenticatedAdminMiddleware, validateBody(SpecificServiceSchema), SpecificServiceController.createSpecificService)

specificServiceRouter.patch(
  "/:serviceId",
  isAuthenticatedAdminMiddleware,
  validateParams(
    z.object({
      serviceId: z.number().transform(Number)
    })
  ),
  validateBody(SpecificServiceSchema),
  SpecificServiceController.updateSpecificService
)

export default specificServiceRouter
