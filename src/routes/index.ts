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
import adminsRouter from "./admin/admins.route"
import adminOrdersRouter from "./admin/orders.route"
import adminServiceRouter from "./admin/services.route"
import adminSpecificServicesRouter from "./admin/specific-services.route"
import illnessTypesRouter from "./admin/illness-types.route"

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
router.use("/admin/admins", adminsRouter)
router.use("/admin/orders", adminOrdersRouter)
router.use("/admin/services", adminServiceRouter)
router.use("/admin/specific-services", adminSpecificServicesRouter)
router.use("/admin/illness-types", illnessTypesRouter)

export default router
