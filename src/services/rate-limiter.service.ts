import rateLimiter from "express-rate-limit"
import { CONFIG } from "../config"

const rateLimiterService = rateLimiter(CONFIG.rateLimiter)

export default rateLimiterService
