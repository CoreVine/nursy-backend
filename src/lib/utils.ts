import z, { ZodError } from "zod"
import { CustomError, ValidationError } from "../errors"

export function generateArray(length: number) {
  return Array.from({ length })
}

export function extractToken(headers: string) {
  return headers.split(" ")[1]
}

export function extractErrors(errors: ZodError) {
  return errors.flatten().fieldErrors
}

export function generateSixDigitCode(): number {
  return Math.floor(100000 + Math.random() * 900000)
}

export function extractCloudinaryPublicId(path: string): string {
  let cleanedPath = path
  try {
    if (path.startsWith("http")) {
      const url = new URL(path)
      cleanedPath = url.pathname

      cleanedPath = cleanedPath.replace(/^\/[^\/]+\/image\/upload\/v\d+\//, "")
      cleanedPath = cleanedPath.replace(/^\/+/, "")
    }
  } catch {}
  return cleanedPath.replace(/\.[^/.]+$/, "")
}

export function select(array: string[]) {
  return {
    select: array.map((item) => {
      const [key, value] = item.split(":")
      return { [key]: true }
    })
  }
}

export function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function toSocketError(e: any, fallbackMessage = "An unexpected error occurred") {
  const errorShape = {
    message: fallbackMessage,
    code: undefined as string | undefined,
    status: 500,
    details: undefined as Array<{ path: string; message: string }> | undefined
  }

  if (e instanceof CustomError) {
    errorShape.message = e.message
    errorShape.status = e.statusCode
    errorShape.code = e.name
    if (e instanceof ValidationError && e.originalZodError) {
      errorShape.details = e.originalZodError.errors.map((err) => ({
        path: err.path.join("."),
        message: err.message
      }))
    }
  } else if (e instanceof ZodError) {
    errorShape.message = "Validation failed"
    errorShape.status = 400
    errorShape.code = "ValidationError"
    errorShape.details = e.errors.map((err) => ({
      path: err.path.join("."),
      message: err.message
    }))
  } else if (e instanceof Error) {
    errorShape.message = e.message
    errorShape.code = e.name
  } else if (typeof e === "string") {
    errorShape.message = e
  }

  return errorShape
}
