import { Request, Response, NextFunction } from "express"
import { CustomError, InternalServerError, ValidationError } from "../errors"

import logger from "../lib/logger"

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err)

  // Log error using Winston logger with request context
  logger.error(`[${req.method} ${req.originalUrl}] ${err.name}: ${err.message}\n${err.stack}`)

  if (err instanceof CustomError) {
    const errorResponse: Record<string, any> = {
      data: null,
      message: err.message,
      status: err.statusCode
    }

    if (err instanceof ValidationError && err.originalZodError) {
      errorResponse.errors = err.originalZodError.flatten().fieldErrors
    }

    if (process.env.NODE_ENV === "development") {
      errorResponse.type = err.name
      errorResponse.stack = err.stack
    }

    return res.status(err.statusCode).json(errorResponse)
  }

  // Programming or unknown error
  const internalError = new InternalServerError("An unexpected internal server error occurred.", err)
  const response: Record<string, any> = {
    data: null,
    message: process.env.NODE_ENV === "production" ? "Something went very wrong! Please try again later." : internalError.message,
    status: internalError.statusCode
  }

  if (process.env.NODE_ENV === "development") {
    response.type = internalError.name
    response.stack = internalError.stack
  }

  return res.status(internalError.statusCode).json(response)
}
