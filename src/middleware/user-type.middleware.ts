import jwtService from "../services/jwt.service"

import { Request, Response, NextFunction } from "express"
import { UnauthorizedError, AuthError } from "../errors"
import { JwtPayload } from "jsonwebtoken"
import { User, UserType } from "@prisma/client"

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function isUserOfTypeMiddleware(type: UserType) {
  return function userType(req: Request, res: Response, next: NextFunction) {
    const user = req.user as JwtPayload
    if (!user) {
      throw new UnauthorizedError("You are not logged in! Please log in to get access.")
    }
    if (user.type !== type) {
      throw new AuthError(`You do not have permission to access this resource. Required user type: ${type}.`)
    }
    next()
  }
}
