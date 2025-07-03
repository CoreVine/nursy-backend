import { Response } from "express";

export function response(res: Response, status: number, message: string, data?: any, errors?: any) {
  return res.status(status).json({
    message,
    status,
    data,
    errors
  });
}
