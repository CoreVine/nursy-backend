import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { STORAGE_CONFIG } from "../config/storage.config"

import multer from "multer"
import fs from "fs"
import path from "path"
import mime from "mime-types"

interface UploadOptions {
  folder?: string
  allowedMimeTypes?: string[]
  maxFileSizeMB?: number
}

// ✅ Setup temp disk storage
const tempStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const tmpPath = path.join(__dirname, "..", "..", "tmp")
    fs.mkdirSync(tmpPath, { recursive: true })
    cb(null, tmpPath)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ""
    const name = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
    cb(null, name)
  }
})

export function createS3Middleware({ folder = "uploads", allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"], maxFileSizeMB = 5 }: UploadOptions = {}) {
  const upload = multer({
    storage: tempStorage,
    limits: {
      fileSize: maxFileSizeMB * 1024 * 1024
    },
    fileFilter: (_req, file, cb) => {
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(new Error("Invalid file type"))
      }
    }
  })

  const s3 = new S3Client({
    region: STORAGE_CONFIG.s3.region!,
    credentials: {
      accessKeyId: STORAGE_CONFIG.s3.accessKeyId!,
      secretAccessKey: STORAGE_CONFIG.s3.secretAccessKey!
    }
  })

  async function uploadToS3(localFilePath: string, fileName: string, contentType: string): Promise<string> {
    const fileStream = fs.createReadStream(localFilePath)
    const Key = `${folder}/${fileName}`

    await s3.send(
      new PutObjectCommand({
        Bucket: STORAGE_CONFIG.s3.bucket,
        Key,
        Body: fileStream,
        ContentType: contentType,
        ACL: "public-read"
      })
    )

    fs.unlinkSync(localFilePath)

    return `https://${STORAGE_CONFIG.s3.bucket}.s3.${STORAGE_CONFIG.s3.region}.amazonaws.com/${Key}`
  }

  return { upload, uploadToS3 }
}
