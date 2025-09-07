import { Router } from "express"

import patientRouter from "./patient.route"
import paymentRouter from "./payment.route"
import nurseRouter from "./nurse.route"
import authRouter from "./auth.route"
import chatRouter from "./chat.route"
import dataRouter from "./data.route"

import adminStatisticsRouter from "./admin/statistics.route"
import adminUsersRouter from "./admin/users.route"
import adminAuthRouter from "./admin/auth.route"

const router = Router()

router.use("/auth", authRouter)
router.use("/nurse", nurseRouter)
router.use("/patient", patientRouter)
router.use("/chats", chatRouter)
router.use("/payments", paymentRouter)
router.use("/data", dataRouter)

router.use("/admin/auth", adminAuthRouter)
router.use("/admin/users", adminUsersRouter)
router.use("/admin/statistics", adminStatisticsRouter)

export default router
