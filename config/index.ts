export const CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET!,
  PORT: process.env.APP_PORT || 3000,
  APP_NAME: process.env.APP_NAME || "Nursy",
  RATE_LIMITER: {
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
