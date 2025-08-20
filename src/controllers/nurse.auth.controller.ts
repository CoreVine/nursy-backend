import moment from "moment"
import bcrypt from "bcryptjs"
import db from "../services/prisma.service"

import jwtService from "../services/jwt.service"
import emailService from "../services/email.service"

import { BadRequestError, ValidationError } from "../errors"
import { RegisterSchema } from "../routes/auth.route"
import { NextFunction, Request, Response } from "express"
import { UserModel } from "../data-access/user"

import { json } from "../lib/helpers"
import { generateSixDigitCode } from "../lib/utils"
import { CONFIG } from "../config"

export default class NurseAuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = RegisterSchema.safeParse(req.body)!
      if (!parsed.success) throw new ValidationError("Errors", parsed.error)

      const { phoneNumber, gender, birthDate, password, username, email, type } = parsed.data

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
          gender,
          birthDate: new Date(birthDate),
          type,
          password: hashedPassword
        }
      })

      if (!user) throw new BadRequestError("Failed to create user")

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

      await db.userWallet.create({
        data: {
          userId: user.id
        }
      })

      const { password: userPassword, ...rest } = user

      const payload = {
        id: user.id,
        email: user.email,
        username: user.username,
        phoneNumber: user.phoneNumber,
        type: user.type,
        isVerified: user.isVerified
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

  static async updateData(req: Request, res: Response, next: NextFunction) {
    try {
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

      const user = req.user
      const realUser = await db.user.findUnique({
        where: { id: user?.id },
        include: { userData: true }
      })

      const updated = await db.userData.update({
        where: { userId: user?.id },
        data: {
          cv: cvFile || realUser?.userData?.cv,
          nusringLicenseFront: nursingLicenseFrontFile || realUser?.userData?.nusringLicenseFront,
          nusringLicenseBack: nursingLicenseBackFile || realUser?.userData?.nusringLicenseBack,
          graduationCertificate: graduationCertificateFile || realUser?.userData?.graduationCertificate,
          nationalIdFront: nationalIdFrontFile || realUser?.userData?.nationalIdFront,
          nationalIdBack: nationalIdBackFile || realUser?.userData?.nationalIdBack
        }
      })

      return json({
        message: "Nurse data updated successfully",
        status: 201,
        data: updated,
        res
      })
    } catch (error) {
      next(error)
    }
  }
}
