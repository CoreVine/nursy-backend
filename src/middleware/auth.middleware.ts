import jwtService from "../services/jwt.service"

import { Request, Response, NextFunction } from "express"
import { UnauthorizedError, AuthError } from "../errors"
import { JwtPayload } from "jsonwebtoken"
import db from "../services/prisma.service"

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
    const mainUser = await db.user.findUnique({
      where: { id: decodedPayload.id }
    })
    if (!mainUser) {
      throw new AuthError("User not found. Please log in again.")
    }
    const { password, ...userWithoutPassword } = mainUser
    req.user = userWithoutPassword
    next()
  } catch (error: any) {
    next(error)
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
    const mainUser = await db.user.findUnique({
      where: { id: decodedPayload.id }
    })
    if (!mainUser) {
      req.user = undefined
      return next()
    }
    const { password, ...userWithoutPassword } = mainUser
    req.user = userWithoutPassword
  } catch (error: any) {
    req.user = undefined
  }

  next()
}
