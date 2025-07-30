export const CONFIG = {
  jwtSecret: process.env.JWT_SECRET!,
  appPort: process.env.APP_PORT || 3000,
  appName: process.env.APP_NAME || "Nursy",
  rateLimiter: {
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: "Too many requests, please try again later.",
      status: 429
    }
  }
}
