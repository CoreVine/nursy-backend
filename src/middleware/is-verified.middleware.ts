import { NextFunction, Request, Response } from "express"
import { UnauthorizedError } from "../errors"
import { JwtPayload } from "jsonwebtoken"
import { AdminJwtPayload } from "../types"

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
      admin?: AdminJwtPayload
    }
  }
}

export function isVerifiedMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.user && req?.user?.isVerified) {
    return next()
  }

  throw new UnauthorizedError("Verification is pending, please wait for approval or contact support.")
}
