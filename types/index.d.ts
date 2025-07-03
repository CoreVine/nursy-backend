import { User } from "@prisma/client"
import { Request } from "express"

type TRequest = Request & {
  user?: User
}

type JwtPayload = Omit<User, "password">
