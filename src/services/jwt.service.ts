import jwt from "jsonwebtoken"
import logger from "../lib/logger"

import { UnauthorizedError } from "../errors"
import { AdminJwtPayload, JwtPayload } from "../types"
import { CONFIG } from "../config"

function signToken(payload: JwtPayload): string {
  try {
    const token = jwt.sign(payload, CONFIG.jwtSecret, {
      expiresIn: (CONFIG.jwtExpiration as any) || "30d"
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
    const decoded = jwt.verify(token, CONFIG.jwtSecret) as JwtPayload
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

function signAdminToken(payload: AdminJwtPayload): string {
  try {
    const token = jwt.sign(payload, CONFIG.jwtAdminSecret, {
      expiresIn: (CONFIG.jwtExpiration as any) || "30d"
    })
    logger.info("[JWT Admin Service] Token signed successfully.")
    return token
  } catch (error: any) {
    logger.error("[JWT Admin Service] Failed to sign token:", error.message, error.stack)
    throw new UnauthorizedError(`Token signing failed: ${error.message}`)
  }
}

function verifyAdminToken(token: string): AdminJwtPayload {
  try {
    const decoded = jwt.verify(token, CONFIG.jwtAdminSecret) as AdminJwtPayload
    logger.info("[JWT Admin Service] Token verified successfully.")
    return decoded
  } catch (error: any) {
    logger.error("[JWT Admin Service] Token verification failed:", error.message, error.stack)
    if (error.name === "TokenExpiredError") {
      throw new UnauthorizedError("Token has expired.")
    }
    if (error.name === "JsonWebTokenError") {
      throw new UnauthorizedError("Invalid token.")
    }
    throw new UnauthorizedError(`Token verification failed: ${error.message}`)
  }
}

function decodeAdminToken(token: string): AdminJwtPayload | null {
  try {
    const decoded = jwt.decode(token) as AdminJwtPayload | null
    logger.info("[JWT Admin Service] Token decoded successfully (without verification).")
    return decoded
  } catch (error: any) {
    logger.error("[JWT Admin Service] Failed to decode token:", error.message, error.stack)
    return null
  }
}

export default {
  signToken,
  verifyToken,
  decodeToken,
  signAdminToken,
  verifyAdminToken,
  decodeAdminToken
}
