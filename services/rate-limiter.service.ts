import rateLimiter from "express-rate-limit"
import { CONFIG } from "../config/index.js"

const rateLimiterService = rateLimiter(CONFIG.RATE_LIMITER)

export default rateLimiterService
