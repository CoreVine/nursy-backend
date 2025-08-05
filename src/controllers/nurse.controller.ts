import { json } from "../lib/helpers"

import { NextFunction, Request, Response } from "express"
import { BadRequestError, NotFoundError } from "../errors"
import { OrderStatusList } from "../lib/type-lists"
import { OrderStatus } from "@prisma/client"
import { OrderModel } from "../data-access/order"
import { TRequest } from "../types"
import { ChatModel } from "../data-access/chat"

class NurseController {
  static async getNurseRequests(req: Request, res: Response, next: NextFunction) {}
  static async changeRequestStatus(req: Request, res: Response, next: NextFunction) {}
  static async getNurseRequestById(req: Request, res: Response, next: NextFunction) {}
}

export default NurseController
