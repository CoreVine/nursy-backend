import "express-async-errors"

import { Request, Response, NextFunction } from "express"
import { CustomError, InternalServerError, ValidationError } from "../errors"

/**
 * Centralized error handling middleware.
 * This middleware catches all errors thrown in the application,
 * logs them, and sends an appropriate JSON response to the client.
 *
 * @param err The error object caught by Express.
 * @param req The Express request object.
 * @param res The Express response object.
 * @param next The Express next middleware function.
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof CustomError) {
    console.error(`[OPERATIONAL ERROR] ${err.name} (Status: ${err.statusCode}): ${err.message}`, err.stack)

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

  const internalError = new InternalServerError("An unexpected internal server error occurred.", err)

  console.error(`[PROGRAMMING ERROR] ${internalError.name}: ${internalError.message}`)
  if ((internalError as any).originalError) {
    console.error("Original Error:", (internalError as any).originalError)
  }
  console.error("Stack:", internalError.stack)

  const internalErrorResponse: Record<string, any> = {
    data: null,
    message: process.env.NODE_ENV === "production" ? "Something went very wrong! Please try again later." : internalError.message,
    status: internalError.statusCode
  }

  if (process.env.NODE_ENV === "development") {
    internalErrorResponse.type = internalError.name
    internalErrorResponse.stack = internalError.stack
  }

  return res.status(internalError.statusCode).json(internalErrorResponse)
}

/**
 * Catches unhandled promise rejections and re-throws them as errors,
 * allowing the global error handler to catch them. This is crucial for
 * catching errors in async operations that aren't explicitly caught by
 * try/catch blocks or handled by 'express-async-errors' (e.g., outside Express routes).
 *
 * It's recommended to call this once at your application's entry point.
 */
export const handleUnhandledRejection = () => {
  process.on("unhandledRejection", (reason: Error | any, promise: Promise<any>) => {
    console.error("UNHANDLED REJECTION! 💥 Shutting down...")
    console.error("Reason:", reason)
    console.error("Promise:", promise)
    if (reason instanceof Error) {
      console.error("Error Name:", reason.name)
      console.error("Error Message:", reason.message)
      console.error("Error Stack:", reason.stack)
    }

    process.exit(1)
  })
}

/**
 * Catches uncaught exceptions (synchronous errors not handled by try/catch).
 * This is the last line of defense for synchronous code.
 *
 * It's recommended to call this once at your application's entry point.
 */
export const handleUncaughtException = () => {
  process.on("uncaughtException", (err: Error) => {
    console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...")
    console.error("Error Name:", err.name)
    console.error("Error Message:", err.message)
    console.error("Error Stack:", err.stack)

    process.exit(1)
  })
}

export default {
  errorHandler,
  handleUnhandledRejection,
  handleUncaughtException
}
