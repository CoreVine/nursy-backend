import z from "zod"

export const AuthSchema = {
  login: z.object({
    email: z.string().email({ message: "Invalid email" }),
    password: z.string().min(1, { message: "Password is Required" })
  }),
  register: z.object({
    name: z.string().min(1, { message: "Name is Required" }),
    password: z.string().min(1, { message: "Password is Required" }),
    email: z.string().email({ message: "Invalid email" })
  })
}
