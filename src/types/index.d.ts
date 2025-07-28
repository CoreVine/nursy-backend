import { User } from "@prisma/client"
import { Request, Response } from "express"

type TRequest = Request & {
  user?: User
}

type TResponse = {
  res: Response
  status: number
  message: string
  data?: any
  errors?: any
}

type JwtPayload = Omit<User, "password">

type PaymobAuthResponse = {
  token: string
}

type PaymobOrderDetails = {
  delivery_needed: boolean
  amount_cents: number
  currency?: string
  items: Array<{
    name: string
    amount_cents: number
    description?: string
    quantity: number
  }>
  merchant_order_id?: string
  shipping_data?: Record<string, any>
}

type PaymobOrderResponse = {
  id: number
  amount_cents: number
  items: any[]
  created_at: string
  merchant_order_id?: string
}

type PaymobPaymentDetails = {
  amount_cents: number
  order_id: number
  billing_data: {
    apartment: string
    email: string
    floor: string
    first_name: string
    street: string
    building: string
    phone_number: string
    shipping_method: string
    postal_code: string
    city: string
    country: string
    last_name: string
    state: string
  }
  currency?: string
  integration_id?: string
  expiration?: number
}

type PaymobPaymentKeyResponse = {
  token: string
}
