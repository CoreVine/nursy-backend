import { Request, Response, NextFunction } from "express"
import { AnyZodObject, ZodError } from "zod"
import { ValidationError } from "../errors"

export const validateBody = (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    let normalizedBody = { ...req.body }

    for (const key in normalizedBody) {
      const value = normalizedBody[key]
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value)
          normalizedBody[key] = parsed
        } catch {}
      }
    }

    if (req.file) normalizedBody.file = req.file
    if (req.files) normalizedBody.files = req.files

    await schema.parseAsync(normalizedBody)

    req.body = normalizedBody

    next()
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("[ZOD VALIDATION ERROR]", error.issues)
      const errorMessage = error.flatten().formErrors.join(", ") || Object.values(error.flatten().fieldErrors).flat().join(", ")
      return next(new ValidationError(`Validation failed: ${errorMessage}`, error))
    }
    next(error)
  }
}
