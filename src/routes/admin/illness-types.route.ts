import { Router } from "express"

import { validateBody, validateParams, validateQueryParams } from "../../middleware/validate.middleware"
import { isAuthenticatedAdminMiddleware } from "../../middleware/auth.middleware"

import IllnessTypeController from "../../controllers/admin/illness-types.controller"
import z from "zod"

export const IllnessTypeSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().max(255)
})

const illnessTypesRouter = Router()

illnessTypesRouter.get(
  "/",
  isAuthenticatedAdminMiddleware,
  validateQueryParams(
    z.object({
      page: z.number().transform(Number).default(1).optional(),
      limit: z.number().transform(Number).default(10).optional(),
      search: z.string().max(255).default("").optional()
    })
  ),
  IllnessTypeController.getIllnessTypes
)

illnessTypesRouter.get(
  "/:id",
  isAuthenticatedAdminMiddleware,
  validateParams(
    z.object({
      id: z.number().transform(Number)
    })
  ),
  IllnessTypeController.getIllnessTypeById
)

illnessTypesRouter.post("/", isAuthenticatedAdminMiddleware, validateBody(IllnessTypeSchema), IllnessTypeController.createIllnessType)

illnessTypesRouter.patch(
  "/:id",
  isAuthenticatedAdminMiddleware,
  validateParams(
    z.object({
      id: z.number().transform(Number)
    })
  ),
  validateBody(IllnessTypeSchema),
  IllnessTypeController.getIllnessTypeById
)

export default illnessTypesRouter
