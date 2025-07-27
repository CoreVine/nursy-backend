import { createLogger, format, transports } from "winston"

const { combine, timestamp, printf, colorize } = format

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`
})

// Check if the application is running in production
const isProduction = process.env.NODE_ENV === "production"

const loggerTransports = [
  new transports.Console() // Console transport
]

// Configure exception handlers
const exceptionHandlers = !isProduction
  ? [
      new transports.File({ filename: "logs/exceptions.log" }) // File transport for exceptions
    ]
  : [
      new transports.Console() // Console transport for exceptions
    ]

const logger = createLogger({
  level: "info",
  format: combine(colorize(), timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
  transports: loggerTransports,
  exceptionHandlers: exceptionHandlers
})

export default logger
