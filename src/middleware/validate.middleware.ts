import { Request, Response, NextFunction } from "express"
import { AnyZodObject, ZodError } from "zod"
import { ValidationError } from "../errors"

const handleValidation = (schema: AnyZodObject, source: "body" | "query" | "params") => async (req: Request, res: Response, next: NextFunction) => {
  try {
    let normalizedData = { ...req[source] }

    // Parse JSON strings if possible (same as you did for body)
    for (const key in normalizedData) {
      const value = normalizedData[key]
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value)
          normalizedData[key] = parsed
        } catch {
          // ignore if not JSON
        }
      }
    }

    // Special handling only for body
    if (source === "body") {
      if (req.file) normalizedData.file = req.file
      if (req.files) normalizedData.files = req.files
    }

    await schema.parseAsync(normalizedData)

    // overwrite request data with validated/normalized values
    req[source] = normalizedData

    next()
  } catch (error) {
    if (error instanceof ZodError) {
      console.error(`[ZOD VALIDATION ERROR] (${source})`, error.issues)
      const errorMessage = error.flatten().formErrors.join(", ") || Object.values(error.flatten().fieldErrors).flat().join(", ")
      return next(new ValidationError(`Validation failed (${source}): ${errorMessage}`, error))
    }
    next(error)
  }
}

// Export helpers
export const validateBody = (schema: AnyZodObject) => handleValidation(schema, "body")
export const validateQueryParams = (schema: AnyZodObject) => handleValidation(schema, "query")
export const validateParams = (schema: AnyZodObject) => handleValidation(schema, "params")
