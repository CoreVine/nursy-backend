import { Router } from "express"
import { isNurseVerifiedMiddleware } from "../middleware/is-nurse-verified.middleware"
import { isAuthenticatedMiddleware } from "../middleware/auth.middleware"

import NurseController from "../controllers/nurse.controller"

export const nurseRouter = Router()

nurseRouter.get("/nurse/requests", isAuthenticatedMiddleware, isNurseVerifiedMiddleware, NurseController.getNurseRequests)
nurseRouter.get("/nurse/requests/:orderId", isAuthenticatedMiddleware, isNurseVerifiedMiddleware, NurseController.getNurseRequestsById)
nurseRouter.patch("/nurse/requests/:orderId", isAuthenticatedMiddleware, isNurseVerifiedMiddleware, NurseController.changeRequestStatus)
