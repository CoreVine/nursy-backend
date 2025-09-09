import jwtService from "../services/jwt.service"

import { Request, Response, NextFunction } from "express"
import { UnauthorizedError, AuthError } from "../errors"
import { JwtPayload } from "jsonwebtoken"
import db from "../services/prisma.service"
import { AdminJwtPayload } from "../types"

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
      admin?: AdminJwtPayload
    }
  }
}

export async function isAuthenticatedMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]
    }

    if (!token) {
      throw new UnauthorizedError("You are not logged in! Please log in to get access.")
    }

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

/// For Admin

export async function isAuthenticatedAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]
    }

    if (!token) {
      throw new UnauthorizedError("You are not logged in! Please log in to get access.")
    }
    const decodedPayload = jwtService.verifyAdminToken(token)
    const mainAdmin = await db.admin.findUnique({
      where: { id: decodedPayload.id }
    })
    if (!mainAdmin) {
      throw new AuthError("Admin not found. Please log in again.")
    }
    const { password, ...adminWithoutPassword } = mainAdmin
    req.admin = adminWithoutPassword
    next()
  } catch (error: any) {
    next(error)
  }
}

export async function assignAdmin(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1]
  }

  if (!token) {
    req.admin = undefined
    return next()
  }

  try {
    const decodedPayload = jwtService.verifyAdminToken(token)
    const mainAdmin = await db.admin.findUnique({
      where: { id: decodedPayload.id }
    })
    if (!mainAdmin) {
      req.admin = undefined
      return next()
    }
    const { password, ...adminWithoutPassword } = mainAdmin
    req.admin = adminWithoutPassword
  } catch (error: any) {
    req.admin = undefined
  }

  next()
}
