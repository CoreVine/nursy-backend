import bcrypt from "bcrypt"
import db from "../services/prisma.service"

import jwtService from "../services/jwt.service"

import { BadRequestError, NotFoundError, UnauthorizedError, ValidationError } from "../errors"
import { LoginSchema, RegisterSchema } from "../routes/auth.route"
import { NextFunction, Request, Response } from "express"
import { UserModel } from "../data-access/user"
import { UserType } from "@prisma/client"

import { json } from "../lib/helpers"

export default class NurseAuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = LoginSchema.safeParse(req.body)!
      if (!parsed.success) throw new ValidationError("Errors", parsed.error)

      const { phoneNumber, password } = parsed.data

      const user = await db.user.findUnique({
        where: { phoneNumber }
      })

      if (!user) throw new NotFoundError("User not found")
      if (user.type !== UserType.Nurse) throw new Error("Invalid Account type. This user is not a Nurse")

      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) throw new UnauthorizedError("Incorrect credentials")

      const { password: userPassword, ...payload } = user

      const token = jwtService.signToken(payload)

      return json({
        message: "Logged in successfully",
        status: 200,
        data: {
          user: payload,
          token
        },
        res
      })
    } catch (error) {
      next(error)
    }
  }

  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = RegisterSchema.safeParse(req.body)!

      if (!parsed.success) throw new ValidationError("Errors", parsed.error)

      const { phoneNumber, password, username, email, type } = parsed.data

      const phoneNumberExists = await UserModel.findByPhoneNumber(phoneNumber)
      if (phoneNumberExists) throw new BadRequestError("Phone number already exists")

      const emailExists = await UserModel.findByEmail(email)
      if (emailExists) throw new BadRequestError("E-mail already exists")

      const hashedPassword = await bcrypt.hash(password, 10)

      const uploadedFiles = req.files as {
        cv?: Express.Multer.File[]
        nursingLicenseFront?: Express.Multer.File[]
        nursingLicenseBack?: Express.Multer.File[]
        graduationCertificate?: Express.Multer.File[]
        nationalIdFront?: Express.Multer.File[]
        nationalIdBack?: Express.Multer.File[]
      }

      const cvFile = uploadedFiles?.["cv"] ? uploadedFiles?.["cv"]?.[0]?.path : null
      const nursingLicenseFrontFile = uploadedFiles?.["nursingLicenseFront"] ? uploadedFiles?.["nursingLicenseFront"]?.[0]?.path : null
      const nursingLicenseBackFile = uploadedFiles?.["nursingLicenseBack"] ? uploadedFiles?.["nursingLicenseBack"]?.[0]?.path : null
      const graduationCertificateFile = uploadedFiles?.["graduationCertificate"] ? uploadedFiles?.["graduationCertificate"]?.[0]?.path : null
      const nationalIdFrontFile = uploadedFiles?.["nationalIdFront"] ? uploadedFiles?.["nationalIdFront"]?.[0]?.path : null
      const nationalIdBackFile = uploadedFiles?.["nationalIdBack"] ? uploadedFiles?.["nationalIdBack"]?.[0]?.path : null

      if (!cvFile || !nursingLicenseFrontFile || !nursingLicenseBackFile || !graduationCertificateFile || !nationalIdFrontFile || !nationalIdBackFile) {
        throw new BadRequestError("All files are required")
      }

      const user = await db.user.create({
        data: {
          username,
          phoneNumber,
          email,
          type,
          password: hashedPassword
        }
      })

      if (!user) throw new BadRequestError("Failed to create user")

      await db.userData.create({
        data: {
          userId: user.id,
          cv: cvFile,
          nusringLicenseFront: nursingLicenseFrontFile,
          nusringLicenseBack: nursingLicenseBackFile,
          graduationCertificate: graduationCertificateFile,
          nationalIdFront: nationalIdFrontFile,
          nationalIdBack: nationalIdBackFile
        }
      })

      const { password: userPassword, ...payload } = user
      const token = jwtService.signToken(payload)

      return json({
        message: "Registered successfully",
        status: 201,
        data: {
          token,
          user: payload
        },
        res
      })
    } catch (error) {
      next(error)
    }
  }
}
