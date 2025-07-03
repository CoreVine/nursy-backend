import { User } from "@prisma/client"
import { ZodError } from "zod"

export function generateArray(length: number) {
  return Array.from({ length })
}

export function extractToken(headers: string) {
  return headers.split(" ")[1]
}

export function extractErrors(errors: ZodError) {
  return errors.flatten().fieldErrors
}
