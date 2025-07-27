import multer from "multer"
import path from "path"
import fs from "fs"

interface UploadOptions {
  allowedMimeTypes?: string[]
  maxFileSizeMB?: number
  uploadPath?: string // relative to project root
}

export function createUploadMiddleware({ allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"], maxFileSizeMB = 5, uploadPath = "uploads" }: UploadOptions = {}) {
  const absoluteUploadPath = path.join(__dirname, "..", uploadPath)

  if (!fs.existsSync(absoluteUploadPath)) {
    fs.mkdirSync(absoluteUploadPath, { recursive: true })
  }

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, absoluteUploadPath)
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
      const ext = path.extname(file.originalname)
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`)
    }
  })

  return multer({
    storage,
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
}

export function deleteLocalFile(relativeFilePath: string): boolean {
  try {
    const absolutePath = path.join(__dirname, "..", "uploads/", relativeFilePath)
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath)
      return true
    }
    return false
  } catch (err) {
    console.error("Failed to delete file:", err)
    return false
  }
}
