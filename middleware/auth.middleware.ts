import jwtService from "../services/jwt.service"

import { Request, Response, NextFunction } from "express"
import { UnauthorizedError, AuthError } from "../errors"

import { JwtPayload } from "../types"

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export async function isAuthenticatedMiddleware(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1]
  }

  if (!token) {
    throw new UnauthorizedError("You are not logged in! Please log in to get access.")
  }

  try {
    const decodedPayload = jwtService.verifyToken(token)

    req.user = decodedPayload

    next()
  } catch (error: any) {
    if (error.message === "Token has expired.") {
      throw new AuthError("Your session has expired. Please log in again.")
    }
    if (error.message === "Invalid token.") {
      throw new AuthError("Invalid token. Please log in again.")
    }
    throw new AuthError(`Authentication failed: ${error.message}`)
  }
}

export async function assignUser(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1]
  }

  if (!token) {
    req.user = undefined
    return next()
  }

  try {
    const decodedPayload = jwtService.verifyToken(token)
    req.user = decodedPayload
  } catch (error: any) {
    req.user = undefined
  }

  next()
}
