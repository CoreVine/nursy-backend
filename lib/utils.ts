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

export function extractPublicId(url: string): string | null {
  const regex = /\/upload\/v\d+\/(.+)$/
  const match = url.match(regex)
  return match ? match[1] : null
}

export function select(array: string[]) {
  return {
    select: array.map((item) => {
      const [key, value] = item.split(":")
      return { [key]: true }
    })
  }
}
