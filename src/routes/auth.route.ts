import PatientAuthController from "../controllers/patient.auth.controller"
import NurseAuthController from "../controllers/nurse.auth.controller"

import { Router } from "express"
import { UserTypeList } from "../lib/type-lists"

import { validateBody } from "../middleware/validate.middleware"
import { z } from "zod"
import { createCloudinaryMiddleware } from "../services/cloundinary.service"
import { isAuthenticatedMiddleware } from "../middleware/auth.middleware"
import { isUserOfTypeMiddleware } from "../middleware/user-type.middleware"

import { Gender } from "@prisma/client"

const authRouter = Router()

export const LoginSchema = z.object({
  phoneNumber: z.string(),
  password: z.string()
})

export const RegisterSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  gender: z.enum([Gender.Female, Gender.Male], { message: "Only Male, Female is allowed" }),
  birthDate: z.coerce.date(),
  type: z.enum(UserTypeList, { message: "Only Allowed types: Patient, Custodian, Nurse" }),
  phoneNumber: z.string(),
  password: z.string().min(6, "Password must be at least 6 characters long")
})

export const UpdateInformationSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long").optional(),
  email: z.string().email("Invalid email address").optional(),
  phoneNumber: z.string().optional()
})

export const UpdateLocationSchema = z.object({
  latitude: z.coerce
    .number()
    .min(-90, "Latitude must be greater than or equal to -90")
    .max(90, "Latitude must be less than or equal to 90")
    .refine((val) => /^-?\d{1,2}(\.\d{1,6})?$/.test(val.toString()), { message: "Latitude must have at most 2 digits before and 6 digits after the decimal point" }),
  longitude: z.coerce
    .number()
    .min(-180, "Longitude must be greater than or equal to -180")
    .max(180, "Longitude must be less than or equal to 180")
    .refine((val) => /^-?\d{1,3}(\.\d{1,6})?$/.test(val.toString()), { message: "Longitude must have at most 3 digits before and 6 digits after the decimal point" })
})

export const UpdatePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, "Current Password must be at least 6 characters long"),
    newPassword: z.string().min(6, "New password must be at least 6 characters long"),
    newPasswordConfirmation: z.string().min(6, "New password confirmation must be at least 6 characters long")
  })
  .refine((data) => data.newPassword === data.newPasswordConfirmation, {
    message: "New password and confirmation do not match",
    path: ["newPasswordConfirmation"]
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

const nurseFiles = cloudinaryUploader.fields([
  { name: "cv", maxCount: 1 },
  { name: "nursingLicenseFront", maxCount: 1 },
  { name: "nursingLicenseBack", maxCount: 1 },
  { name: "graduationCertificate", maxCount: 1 },
  { name: "nationalIdFront", maxCount: 1 },
  { name: "nationalIdBack", maxCount: 1 }
])

authRouter.post("/login", validateBody(LoginSchema), PatientAuthController.login)
authRouter.post("/send-verification", validateBody(SendVerificationTokenSchema), PatientAuthController.sendVerificationToken)
authRouter.post("/verify-email", validateBody(VerifyAccountSchema), PatientAuthController.verifyAccount)

authRouter.patch("/profile/update-location", isAuthenticatedMiddleware, validateBody(UpdateLocationSchema), PatientAuthController.updateLocation)
authRouter.patch("/profile/update-password", isAuthenticatedMiddleware, PatientAuthController.updatePassword)
authRouter.patch("/profile/update-information", isAuthenticatedMiddleware, cloudinaryUploader.single("nationalIdPicture"), validateBody(UpdateInformationSchema), PatientAuthController.updateInformation)

authRouter.patch("/nurse/profile/update-data", isAuthenticatedMiddleware, isUserOfTypeMiddleware("Nurse"), nurseFiles, NurseAuthController.updateData)

authRouter.get("/me", isAuthenticatedMiddleware, PatientAuthController.getUser)

authRouter.post("/patient/register", cloudinaryUploader.single("nationalIdPicture"), validateBody(RegisterSchema), PatientAuthController.register)
authRouter.post("/nurse/register", nurseFiles, validateBody(RegisterSchema), NurseAuthController.register)

export default authRouter
