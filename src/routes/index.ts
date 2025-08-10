import authRouter from "./auth.route"
import nurseRouter from "./nurse.route"
import chatRouter from "./chat.route"
import patientRouter from "./patient.route"
import paymentRouter from "./payment.route"
import dataRouter from "./data.route"

import { Router } from "express"

const router = Router()

router.use("/auth", authRouter)
router.use("/nurse", nurseRouter)
router.use("/patient", patientRouter)
router.use("/chats", chatRouter)
router.use("/payments", paymentRouter)
router.use("/data", dataRouter)

export default router
