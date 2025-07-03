import bcrypt from "bcrypt"
import db from "../services/prisma.service"

import jwtService from "../services/jwt.service"

import { Request, Response } from "express"
import { TRequest } from "../types"

export default class AuthController {
  static async login(req: Request, res: Response) {}

  static async register(req: Request, res: Response) {}

  static async getUser(req: Request, res: Response) {}
}
