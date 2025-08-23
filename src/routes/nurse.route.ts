import { Router } from "express"

import { isVerifiedMiddleware } from "../middleware/is-verified.middleware"
import { isAuthenticatedMiddleware } from "../middleware/auth.middleware"
import { isUserOfTypeMiddleware } from "../middleware/user-type.middleware"

import NurseController from "../controllers/nurse.controller"

export const nurseRouter = Router()

nurseRouter.get("/requests", isAuthenticatedMiddleware, isVerifiedMiddleware, isUserOfTypeMiddleware("Nurse"), NurseController.getRequests)
nurseRouter.get("/requests-pending/current", isAuthenticatedMiddleware, isVerifiedMiddleware, isUserOfTypeMiddleware("Nurse"), NurseController.hasPendingRequest)
nurseRouter.get("/requests/:orderId", isAuthenticatedMiddleware, isVerifiedMiddleware, isUserOfTypeMiddleware("Nurse"), NurseController.getRequestById)

export default nurseRouter
