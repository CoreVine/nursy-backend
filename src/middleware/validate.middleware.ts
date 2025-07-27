import { Request, Response, NextFunction } from "express"
import { AnyZodObject, ZodError } from "zod"
import { ValidationError } from "../errors"

/**
 * Middleware to validate JSON or FormData bodies against a Zod schema.
 */
export const validateBody = (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    // If multipart/form-data was used, req.body fields are strings
    let normalizedBody = { ...req.body }

    // Convert JSON-like strings into objects automatically
    for (const key in normalizedBody) {
      const value = normalizedBody[key]
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value)
          normalizedBody[key] = parsed // e.g. `{ "settings": "{\"darkMode\":true}" }`
        } catch {
          // keep as string if not JSON
        }
      }
    }

    // Merge files if needed
    if (req.file) normalizedBody.file = req.file
    if (req.files) normalizedBody.files = req.files

    // Validate against schema
    await schema.parseAsync(normalizedBody)

    // Assign the normalized validated body back for downstream
    req.body = normalizedBody

    next()
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("[ZOD VALIDATION ERROR]", error.issues)
      const errorMessage = error.flatten().formErrors.join(", ") || Object.values(error.flatten().fieldErrors).flat().join(", ")
      throw new ValidationError(`Validation failed: ${errorMessage}`, error)
    }
    throw error
  }
}
