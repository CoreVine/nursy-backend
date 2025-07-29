import PatientController from "../controllers/patient.controller"

import { Router } from "express"
import { RegEx } from "../lib/regex"

import { isAuthenticatedMiddleware } from "../middleware/auth.middleware"
import { isUserOfTypeMiddleware } from "../middleware/user-type.middleware"
import { isVerifiedMiddleware } from "../middleware/is-verified.middleware"
import { validateBody } from "../middleware/validate.middleware"

import { z } from "zod"
import { OrderTypeList } from "../lib/type-lists"
import { OrderType } from "@prisma/client"

export const patientRouter = Router()
export const decimalString = z.string().regex(/^\d{1,6}(\.\d{1,2})?$/, "Invalid decimal format (max 8 digits, 2 decimal places)")

export const CreateRequestSchema = z.object({
  nurseId: z.number().int().positive(),
  serviceId: z.number().int().positive(),
  location: z.string().min(1, "Location is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  employmentType: z.string().min(1, "Employment type is required"),
  locationUrl: z.string().url("Location URL must be a valid URL").optional(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  type: z.enum([OrderType.OnSpot, OrderType.Scheduled]),
  date: z.string().regex(RegEx.date, "Invalid Date. Must be of format (YYYY-MM-DD)").optional(),
  time: z.string().regex(RegEx.time, "Invalid Time. Must be of format (HH:MM:SS)").optional(),
  additionalInformation: z.string().optional(),
  illnessType: z.string(),
  gender: z.enum(["Male", "Female"], {
    message: "Male, Female, only valid values"
  }),
  age: z.number().positive()
})

export const CreateRequestPaymentSchema = z.object({
  totalHours: z.coerce.number().positive()
})

patientRouter.post("/requests", isAuthenticatedMiddleware, isVerifiedMiddleware, isUserOfTypeMiddleware("Patient"), validateBody(CreateRequestSchema), PatientController.createRequest)
patientRouter.get("/requests", isAuthenticatedMiddleware, isVerifiedMiddleware, isUserOfTypeMiddleware("Patient"), PatientController.getRequests)
patientRouter.get("/requests/:orderId", isAuthenticatedMiddleware, isVerifiedMiddleware, isUserOfTypeMiddleware("Patient"), PatientController.getRequestById)
patientRouter.post("/requests/:orderId/initialize-payment", isAuthenticatedMiddleware, isVerifiedMiddleware, isUserOfTypeMiddleware("Patient"), validateBody(CreateRequestPaymentSchema), PatientController.initializePayment)

export default patientRouter
