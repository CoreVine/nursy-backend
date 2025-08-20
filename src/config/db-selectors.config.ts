import { Prisma } from "@prisma/client"

type UserSelectKeys = keyof Prisma.UserSelect
const defaultUserFields: UserSelectKeys[] = ["id", "username", "phoneNumber", "email", "isVerified"]

export function userSelector<K extends UserSelectKeys = (typeof defaultUserFields)[number]>(...fields: K[]): { select: { [P in K]: true } } {
  const selectedFields = fields.length ? fields : (defaultUserFields as K[])
  return {
    select: Object.fromEntries(selectedFields.map((key) => [key, true])) as { [P in K]: true }
  }
}
