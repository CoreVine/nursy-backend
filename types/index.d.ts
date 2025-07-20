import { User } from "@prisma/client"
import { Request, Response } from "express"

type TRequest = Request & {
  user?: User
}

type TResponse = {
  res: Response
  status: number
  message: string
  data?: any
  errors?: any
}

type JwtPayload = Omit<User, "password">
