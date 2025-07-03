import multer from "multer"

import { v2 as cloudinary } from "cloudinary"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import { STORAGE_CONFIG } from "../config/storage.config"

cloudinary.config({
  cloud_name: STORAGE_CONFIG.cloudinary.cloudName,
  api_key: STORAGE_CONFIG.cloudinary.apiKey,
  api_secret: STORAGE_CONFIG.cloudinary.apiSecret
})

interface CloudinaryUploadOptions {
  folder?: string
  allowedFormats?: string[]
  transformation?: object[] // Can be any Cloudinary transformation options
}

/**
 * Creates a Multer upload middleware for Cloudinary
 */
export function createCloudinaryMiddleware({ folder = "uploads", allowedFormats = ["jpg", "jpeg", "png", "webp"], transformation }: CloudinaryUploadOptions = {}) {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (_req, file) => {
      return {
        folder,
        allowed_formats: allowedFormats,
        public_id: `${file.fieldname}-${Date.now()}`,
        ...(transformation ? { transformation } : {})
      }
    }
  })

  return multer({ storage })
}

export async function deleteCloudinaryFile(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result.result === "ok"
  } catch (err) {
    console.error("Failed to delete Cloudinary file:", err)
    return false
  }
}
