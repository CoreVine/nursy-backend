import PatientAuthController from "../controllers/patient.auth.controller"
import NurseAuthController from "../controllers/nurse.auth.controller"

import { Router } from "express"
import { UserTypeList } from "../lib/type-lists"

import { validateBody } from "../middleware/validate.middleware"
import { z } from "zod"
import { createCloudinaryMiddleware } from "../services/cloundinary.service"
import { isAuthenticatedMiddleware } from "../middleware/auth.middleware"

const authRouter = Router()

export const LoginSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 characters long"),
  password: z.string()
})

export const RegisterSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  type: z.enum(UserTypeList, { message: "Only Allowed types: Patient, Custodian, Nurse" }),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 characters long"),
  password: z.string().min(6, "Password must be at least 6 characters long")
})

export const SendVerificationTokenSchema = z.object({
  email: z.string().email("Invalid E-mail address")
})

export const VerifyAccountSchema = z.object({
  email: z.string().email("Invalid E-mail address"),
  code: z.number()
})

const cloudinaryUploader = createCloudinaryMiddleware({
  folder: "nursy/users",
  allowedFormats: ["jpg", "jpeg", "png", "webp", "pdf"]
})

authRouter.post("/login", validateBody(LoginSchema), PatientAuthController.login)
authRouter.post("/send-verification", validateBody(SendVerificationTokenSchema), PatientAuthController.sendVerificationToken)
authRouter.post("/verify-email", validateBody(VerifyAccountSchema), PatientAuthController.verifyAccount)

authRouter.get("/me", isAuthenticatedMiddleware, PatientAuthController.getUser)

authRouter.post("/patient/register", cloudinaryUploader.single("nationalIdPicture"), validateBody(RegisterSchema), PatientAuthController.register)
authRouter.post(
  "/nurse/register",
  cloudinaryUploader.fields([
    { name: "cv", maxCount: 1 },
    { name: "nursingLicenseFront", maxCount: 1 },
    { name: "nursingLicenseBack", maxCount: 1 },
    { name: "graduationCertificate", maxCount: 1 },
    { name: "nationalIdFront", maxCount: 1 },
    { name: "nationalIdBack", maxCount: 1 }
  ]),
  validateBody(RegisterSchema),
  NurseAuthController.register
)

export default authRouter
