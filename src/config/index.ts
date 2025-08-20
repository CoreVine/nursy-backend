export const CONFIG = {
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiration: process.env.JWT_EXPIRES_IN || "30d",
  appPort: process.env.APP_PORT,
  appName: process.env.APP_NAME || "Nursy",
  appUrl: process.env.APP_URL || "http://localhost:8099",
  cashFees: process.env.CASH_FEES || 50.0,
  hourlyRate: process.env.HOURLY_RATE || 100.0,
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
