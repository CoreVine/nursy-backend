import bcrypt from "bcryptjs"
import moment from "moment"
import db from "../services/prisma.service"

import emailService from "../services/email.service"
import jwtService from "../services/jwt.service"

import { BadRequestError, NotFoundError, UnauthorizedError, ValidationError } from "../errors"
import { LoginSchema, RegisterSchema, SendVerificationTokenSchema, VerifyAccountSchema } from "../routes/auth.route"
import { NextFunction, Request, Response } from "express"
import { TRequest } from "../types"
import { UserModel } from "../data-access/user"
import { UserType } from "@prisma/client"

import { generateSixDigitCode } from "../lib/utils"
import { CONFIG } from "../config"
import { json } from "../lib/helpers"

export default class PatientAuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = LoginSchema.safeParse(req.body)!
      if (!parsed.success) throw new ValidationError("Errors", parsed.error)

      const { phoneNumber, password } = parsed.data

      const user = await db.user.findUnique({
        where: { phoneNumber },
        include: { userData: true }
      })

      if (!user) throw new NotFoundError("User not found")

      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) throw new UnauthorizedError("Incorrect credentials")

      const { password: userPassword, ...rest } = user
      const payload = {
        id: user.id,
        email: user.email
      }

      const token = jwtService.signToken(payload)

      return json({
        message: "Logged in successfully",
        status: 200,
        data: {
          user: rest,
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

      if (type == UserType.Patient && req.file) throw new BadRequestError("Patients should not upload a National ID picture")
      if (type == UserType.Custodian && !req.file) throw new BadRequestError("Custodian should upload a National ID picture")

      const phoneNumberExists = await UserModel.findByPhoneNumber(phoneNumber)
      if (phoneNumberExists) throw new BadRequestError("Phone number already exists")

      const emailExists = await UserModel.findByEmail(email)
      if (emailExists) throw new BadRequestError("E-mail already exists")

      const hashedPassword = await bcrypt.hash(password, 10)
      const fileUrl = req.file?.path

      const user = await db.user.create({
        data: {
          username,
          phoneNumber,
          email,
          type,
          nationalIdPicture: fileUrl,
          password: hashedPassword
        }
      })

      const randomInt = generateSixDigitCode()
      const hashedRandomInt = await bcrypt.hash(randomInt.toString(), 10)
      const verification = await UserModel.createVerificationToken(user.id, hashedRandomInt)

      const emailTemplate = await emailService.sendTemplateEmail(user.email, CONFIG.appName, "account-verification", {
        name: user.username,
        verificationCode: randomInt,
        companyName: CONFIG.appName,
        currentYear: new Date().getFullYear(),
        expiryMinutes: moment(verification?.expiresAt).format("MMMM Do YYYY, h:mm:ss A")
      })

      const { password: userPassword, ...rest } = user
      const payload = {
        id: user.id,
        email: user.email
      }
      const token = jwtService.signToken(payload)

      return json({
        message: "Registered successfully",
        status: 201,
        data: {
          token,
          user: rest
        },
        res
      })
    } catch (error) {
      next(error)
    }
  }

  static async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as TRequest).user
      if (!user) throw new NotFoundError("User not found")

      const loggedIn = await db.user.findUnique({
        where: { id: user.id },
        include: { userData: true }
      })

      if (!loggedIn) throw new NotFoundError("User not found")

      const { password, ...payload } = loggedIn

      return json({
        message: "User retrieved successfully",
        status: 200,
        data: payload,
        res
      })
    } catch (error) {
      next(error)
    }
  }

  static async sendVerificationToken(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = SendVerificationTokenSchema.safeParse(req.body)
      if (!parsed.success) throw new ValidationError("Errors", parsed.error)

      const { email } = parsed.data

      const user = await UserModel.findByEmail(email)
      if (!user) throw new NotFoundError("User not found")

      if (user.isVerified) throw new BadRequestError("Account already verified")

      const existingVerification = await UserModel.findVerificationToken(user.id)

      if (existingVerification) {
        if (moment().isBefore(moment(existingVerification.expiresAt))) {
          throw new BadRequestError("A verification token has already been sent. Please wait for it to expire.")
        }
        await db.verificationToken.delete({
          where: { id: existingVerification.id }
        })
      }

      const randomInt = generateSixDigitCode()
      const hashedRandomInt = await bcrypt.hash(randomInt.toString(), 10)

      const verification = await UserModel.createVerificationToken(user.id, hashedRandomInt)

      await emailService.sendTemplateEmail(user.email, CONFIG.appName, "account-verification", {
        name: user.username,
        verificationCode: randomInt,
        companyName: CONFIG.appName,
        currentYear: new Date().getFullYear(),
        expiryMinutes: moment(verification?.expiresAt).format("MMMM Do YYYY, h:mm:ss A")
      })

      return json({
        message: "Verification token sent successfully",
        status: 200,
        res
      })
    } catch (error) {
      next(error)
    }
  }

  static async verifyAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = VerifyAccountSchema.safeParse(req.body)
      if (!parsed.success) throw new ValidationError("Errors", parsed.error)

      const { email, code } = parsed.data

      const user = await UserModel.findByEmail(email)
      if (!user) throw new NotFoundError("User not found")

      if (user.isVerified) throw new BadRequestError("Account already verified")

      const verification = await UserModel.findVerificationToken(user.id)
      if (!verification) throw new BadRequestError("Verification token not found")

      const isCodeValid = await bcrypt.compare(code.toString(), verification.token)
      if (!isCodeValid) throw new BadRequestError("Invalid verification code")

      if (moment().isAfter(moment(verification.expiresAt))) {
        throw new BadRequestError("Verification code has expired")
      }

      await db.user.update({
        where: { id: user.id },
        data: { isVerified: true, verifiedAt: new Date(), verifiedBy: "email" }
      })

      await db.verificationToken.delete({
        where: { id: verification.id }
      })

      return json({
        message: "Account verified successfully",
        status: 200,
        res
      })
    } catch (error) {
      next(error)
    }
  }
}
