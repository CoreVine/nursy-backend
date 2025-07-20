import { Response } from "express"

import { TResponse } from "../types"

export function json({ res, message, status, data, errors }: TResponse) {
  return res.status(status).json({
    message,
    status,
    data,
    errors
  })
}
