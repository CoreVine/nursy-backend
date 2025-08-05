import crypto from "crypto"

import { KashierHashData, PaymentInitResult, UserPaymentData } from "../types"
import { CONFIG } from "../config"

export class KashierService {
  private baseUrl: string
  private merchantId: string
  private apiKey: string
  private testMode: boolean

  constructor() {
    this.baseUrl = process.env.KASHIER_BASE_URL!
    this.merchantId = process.env.KASHIER_MERCHANT_ID!
    this.apiKey = process.env.KASHIER_API_KEY!
    this.testMode = process.env.KASHIER_TEST_MODE! === "true"
  }

  private generateOrderId(): string {
    return `SUB-${crypto.randomBytes(5).toString("hex")}`
  }

  private generateHash(data: KashierHashData): string {
    const path = `/?payment=${data.merchantId}.${data.orderId}.${data.amount}.${data.currency}`
    return crypto.createHmac("sha256", this.apiKey).update(path).digest("hex")
  }

  public initializePayment(paymentData: UserPaymentData): PaymentInitResult {
    const orderId = this.generateOrderId()

    const coreData = {
      merchantId: this.merchantId,
      orderId,
      amount: paymentData.amount,
      currency: paymentData.currency
    }

    const hash = this.generateHash(coreData)

    const data: Record<string, string | number> = {
      merchantId: this.merchantId,
      orderId,
      mode: this.testMode ? "test" : "live",
      amount: paymentData.amount,
      currency: paymentData.currency,
      hash,
      merchantRedirect: `${CONFIG.appUrl}/api/payments/${paymentData.id}/verify`,
      allowedMethods: "card,wallet,bank_installments",
      display: "en"
    }

    paymentData.kashier_order_id = orderId

    const paymentUrl = `${this.baseUrl}?${new URLSearchParams(data as Record<string, string>).toString()}`

    return {
      payment_url: paymentUrl,
      form_url: this.baseUrl,
      form_method: "GET",
      data
    }
  }

  public verifyPayment(input: { hash: string; amount: number; currency: string; merchantId: string; orderId: string }): boolean {
    const { hash, ...coreData } = input
    const calculatedHash = this.generateHash(coreData)
    return hash === calculatedHash
  }

  public verifyWebhookSignature(signature: string, data: Record<string, string>): boolean {
    const queryString = Object.entries(data)
      .filter(([key]) => key !== "signature" && key !== "mode")
      .map(([key, value]) => `${key}=${value}`)
      .join("&")

    const calculatedSignature = crypto.createHmac("sha256", this.apiKey).update(queryString).digest("hex")

    return signature === calculatedSignature
  }
}
