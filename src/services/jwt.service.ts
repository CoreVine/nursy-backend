import jwt from "jsonwebtoken"
import logger from "../lib/logger"

import { UnauthorizedError } from "../errors"
import { JwtPayload } from "../types"

const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkeythatshouldbeverylongandrandom"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d"

function signToken(payload: JwtPayload): string {
  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      algorithm: "HS256"
    })
    logger.info("[JWT Service] Token signed successfully.")
    return token
  } catch (error: any) {
    logger.error("[JWT Service] Failed to sign token:", error.message, error.stack)
    throw new UnauthorizedError(`Token signing failed: ${error.message}`)
  }
}

function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    logger.info("[JWT Service] Token verified successfully.")
    return decoded
  } catch (error: any) {
    logger.error("[JWT Service] Token verification failed:", error.message, error.stack)
    if (error.name === "TokenExpiredError") {
      throw new UnauthorizedError("Token has expired.")
    }
    if (error.name === "JsonWebTokenError") {
      throw new UnauthorizedError("Invalid token.")
    }
    throw new UnauthorizedError(`Token verification failed: ${error.message}`)
  }
}

function decodeToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.decode(token) as JwtPayload | null
    logger.info("[JWT Service] Token decoded successfully (without verification).")
    return decoded
  } catch (error: any) {
    logger.error("[JWT Service] Failed to decode token:", error.message, error.stack)
    return null
  }
}

export default {
  signToken,
  verifyToken,
  decodeToken
}
