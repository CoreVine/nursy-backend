import { Request, Response, NextFunction } from "express"
import { AnyZodObject, ZodError } from "zod"
import { ValidationError } from "../errors"

/**
 * Middleware factory to validate request body against a Zod schema.
 * If validation fails, it throws a ValidationError which will be caught
 * by the main error handler.
 *
 * @param schema The Zod schema to validate the request body against.
 * @returns An Express middleware function.
 */
export const validateBody = (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.parseAsync(req.body)
    next()
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("[ZOD VALIDATION ERROR]", error.issues)
      const errorMessage = error.flatten().formErrors.join(", ") || Object.values(error.flatten().fieldErrors).flat().join(", ")
      throw new ValidationError(`Validation failed: ${errorMessage}`, error) // Pass the ZodError instance
    }
    throw error
  }
}
