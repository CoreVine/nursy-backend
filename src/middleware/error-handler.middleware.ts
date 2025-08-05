import { Request, Response, NextFunction } from "express"
import { CustomError, InternalServerError, ValidationError } from "../errors"

import logger from "../lib/logger"

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err)

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

    errorResponse.type = err.name
    errorResponse.stack = err.stack

    return res.status(err.statusCode).json(errorResponse)
  }

  const internalError = new InternalServerError("An unexpected internal server error occurred.", err)
  const response: Record<string, any> = {
    data: null,
    message: internalError?.message || "Something went very wrong! Please try again later.",
    status: internalError.statusCode
  }

  response.type = internalError.name
  response.stack = internalError.stack

  return res.status(internalError.statusCode).json(response)
}
