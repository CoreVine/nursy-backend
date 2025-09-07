import { Router } from "express"
import z from "zod"

import AdminAuthController from "../../controllers/admin/auth.controller"
import { isAuthenticatedAdminMiddleware } from "../../middleware/auth.middleware"
import { validateBody } from "../../middleware/validate.middleware"

const adminAuthRouter = Router()

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

export const RegisterSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long")
})

export const UpdateInformationSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long").optional(),
  email: z.string().email("Invalid email address").optional()
})

export const UpdatePasswordSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z.string().min(6, "New password must be at least 6 characters long"),
    newPasswordConfirmation: z.string().min(6, "New password confirmation must be at least 6 characters long")
  })
  .refine((data) => data.newPassword === data.newPasswordConfirmation, {
    message: "New password and confirmation do not match",
    path: ["newPasswordConfirmation"]
  })

adminAuthRouter.post("/register", AdminAuthController.register)
adminAuthRouter.post("/login", AdminAuthController.login)

adminAuthRouter.get("/me", isAuthenticatedAdminMiddleware, AdminAuthController.getAdmin)

adminAuthRouter.patch("/update-password", isAuthenticatedAdminMiddleware, validateBody(UpdatePasswordSchema as any), AdminAuthController.updatePassword)
adminAuthRouter.patch("/update-information", isAuthenticatedAdminMiddleware, validateBody(UpdateInformationSchema), AdminAuthController.updateInformation)

export default adminAuthRouter
