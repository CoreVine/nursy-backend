import { Router } from "express"

import { isVerifiedMiddleware } from "../middleware/is-verified.middleware"
import { isAuthenticatedMiddleware } from "../middleware/auth.middleware"
import { isUserOfTypeMiddleware } from "../middleware/user-type.middleware"

import DataController from "../controllers/data.controller"

export const nurseRouter = Router()

nurseRouter.get("/services", isAuthenticatedMiddleware, isVerifiedMiddleware, DataController.getServices)
nurseRouter.get("/services/:id", isAuthenticatedMiddleware, isVerifiedMiddleware, DataController.getServiceById)

nurseRouter.get("/specific-services", isAuthenticatedMiddleware, isVerifiedMiddleware, DataController.getSpecificServices)
nurseRouter.get("/specific-services/:id", isAuthenticatedMiddleware, isVerifiedMiddleware, DataController.getSpecificServiceById)

nurseRouter.get("/illness-types", isAuthenticatedMiddleware, isVerifiedMiddleware, DataController.getIllnessTypes)
nurseRouter.get("/illness-types/:id", isAuthenticatedMiddleware, isVerifiedMiddleware, DataController.getIllnessTypeById)

export default nurseRouter
