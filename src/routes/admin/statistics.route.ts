import { Router } from "express"
import z from "zod"

import AdminStatisticsController from "../../controllers/admin/statistics.controller"
import { isAuthenticatedAdminMiddleware } from "../../middleware/auth.middleware"
import { validateBody } from "../../middleware/validate.middleware"

const adminStatisticsRouter = Router()

adminStatisticsRouter.get("/all", isAuthenticatedAdminMiddleware, AdminStatisticsController.getStatistics)

export default adminStatisticsRouter
