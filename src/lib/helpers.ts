import { Response } from "express"

import { TResponse } from "../types"

export function json({ res, message = "Fetch Request", status = 200, data, errors }: TResponse) {
  return res.status(status).json({
    message,
    status,
    data,
    errors
  })
}
