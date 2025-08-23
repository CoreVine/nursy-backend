import PatientController from "../controllers/patient.controller"

import { Router } from "express"

import { isAuthenticatedMiddleware } from "../middleware/auth.middleware"
import { isUserOfTypeMiddleware } from "../middleware/user-type.middleware"
import { isVerifiedMiddleware } from "../middleware/is-verified.middleware"

import { z } from "zod"

export const patientRouter = Router()
export const decimalString = z.string().regex(/^\d{1,6}(\.\d{1,2})?$/, "Invalid decimal format (max 8 digits, 2 decimal places)")

patientRouter.get("/requests", isAuthenticatedMiddleware, isVerifiedMiddleware, isUserOfTypeMiddleware("Patient"), PatientController.getRequests)
patientRouter.get("/requests-pending/current", isAuthenticatedMiddleware, isVerifiedMiddleware, isUserOfTypeMiddleware("Patient"), PatientController.hasPendingRequest)
patientRouter.get("/requests/:orderId", isAuthenticatedMiddleware, isVerifiedMiddleware, isUserOfTypeMiddleware("Patient"), PatientController.getRequestById)

export default patientRouter
