import { ZodError } from "zod"

export class CustomError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.name = this.constructor.name

    Error.captureStackTrace(this, this.constructor)
  }
}

export class AuthError extends CustomError {
  constructor(message: string = "Authentication failed. Invalid credentials.") {
    super(message, 401)
    this.name = "AuthError"
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string = "You are not authenticated to access this resource.") {
    super(message, 401)
    this.name = "UnauthorizedError"
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string = "You do not have permission to perform this action.") {
    super(message, 403)
    this.name = "ForbiddenError"
  }
}

export class DatabaseError extends CustomError {
  constructor(message: string = "A database error occurred.", originalError?: Error) {
    const fullMessage = originalError ? `${message} Original error: ${originalError.message}` : message
    super(fullMessage, 500, false)
    this.name = "DatabaseError"
    if (originalError) {
      ;(this as any).originalError = originalError
    }
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = "Resource not found.") {
    super(message, 404)
    this.name = "NotFoundError"
  }
}

export class BadRequestError extends CustomError {
  constructor(message: string = "Invalid request data.") {
    super(message, 400)
    this.name = "BadRequestError"
  }
}

export class InternalServerError extends CustomError {
  constructor(message: string = "An unexpected internal server error occurred.", originalError?: Error) {
    const fullMessage = originalError ? `${message} Original error: ${originalError.message}` : message
    super(fullMessage, 500, false)
    this.name = "InternalServerError"
    if (originalError) {
      ;(this as any).originalError = originalError
    }
  }
}

export class ValidationError extends CustomError {
  public originalZodError?: ZodError

  constructor(message: string = "Validation failed.", originalZodError?: ZodError) {
    super(message, 400)
    this.name = "ValidationError"
    this.originalZodError = originalZodError
  }
}
