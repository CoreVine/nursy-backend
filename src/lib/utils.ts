import { ZodError } from "zod"

export function generateArray(length: number) {
  return Array.from({ length })
}

export function extractToken(headers: string) {
  return headers.split(" ")[1]
}

export function extractErrors(errors: ZodError) {
  return errors.flatten().fieldErrors
}

export function generateSixDigitCode(): number {
  return Math.floor(100000 + Math.random() * 900000)
}

export function extractCloudinaryPublicId(path: string): string {
  let cleanedPath = path
  try {
    if (path.startsWith("http")) {
      const url = new URL(path)
      cleanedPath = url.pathname

      cleanedPath = cleanedPath.replace(/^\/[^\/]+\/image\/upload\/v\d+\//, "")
      cleanedPath = cleanedPath.replace(/^\/+/, "")
    }
  } catch {}
  return cleanedPath.replace(/\.[^/.]+$/, "")
}

export function select(array: string[]) {
  return {
    select: array.map((item) => {
      const [key, value] = item.split(":")
      return { [key]: true }
    })
  }
}
