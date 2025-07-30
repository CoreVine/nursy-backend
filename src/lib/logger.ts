import { createLogger, format, transports } from "winston"

const { combine, timestamp, printf, colorize } = format

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`
})

const loggerTransports = [new transports.Console()]
const exceptionHandlers = [new transports.Console()]

const logger = createLogger({
  level: "info",
  format: combine(colorize(), timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
  transports: loggerTransports,
  exceptionHandlers: exceptionHandlers
})

export default logger
