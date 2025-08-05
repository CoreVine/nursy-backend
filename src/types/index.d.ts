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

type JwtPayload = {
  id: number
  email: string
}

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

interface Plan {
  name: string
}

export interface UserPaymentData {
  id: number | string
  amount: number
  currency: string
  kashier_order_id?: string
}

interface PaymentInitResult {
  payment_url: string
  form_url: string
  form_method: "GET"
  data: Record<string, string | number>
}

interface IframePaymentData {
  amount: number
  description: string
  hash: string
  currency: string
  orderId: string
  merchantId: string
  allowedMethods: string
  merchantRedirect: string
  mode: "test" | "live"
  store: string
  type: "external"
  display: string
}

type KashierHashData = {
  merchantId: string
  orderId: string
  amount: number
  currency: string
}
