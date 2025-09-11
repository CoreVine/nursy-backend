import { Router } from "express"
import z from "zod"

import AdminStatisticsController from "../../controllers/admin/statistics.controller"
import { isAuthenticatedAdminMiddleware } from "../../middleware/auth.middleware"
import { validateBody, validateQueryParams } from "../../middleware/validate.middleware"

const adminStatisticsRouter = Router()

adminStatisticsRouter.get(
  "/all",
  isAuthenticatedAdminMiddleware,
  validateQueryParams(
    z.object({
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional()
    })
  ),
  AdminStatisticsController.getStatistics
)

export default adminStatisticsRouter
