import { NextFunction, Request, Response } from "express"
import { JwtPayload } from "jsonwebtoken"
import { InternalServerError, UnauthorizedError } from "../errors"
import logger from "../lib/logger"

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function isNurseVerifiedMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req?.user && req?.user?.isVerified) {
    return next()
  }

  throw new UnauthorizedError("Verification is pending, please wait for approval or contact support.")
}
