export const KASHIER_CONFIG = {
  apiKey: process.env.KASHIER_API_KEY!,
  merchantId: process.env.KASHIER_WEBHOOK_SECRET!,
  secret: process.env.KASHIER_SECRET!,
  baseUrl: process.env.KASHIER_BASE_URL!,
  testMode: process.env.KASHIER_TEST_MODE === "true",
  apiUrl: process.env.KASHIER_API_URL!,
  storeName: process.env.KASHIER_STORE_NAME || "Nursy",
  allowedMethods: process.env.KASHIER_ALLOWED_METHODS || "card,wallet,bank_installments",
  display: process.env.APP_LOCALE || "en",
  merchantRedirect: `${process.env.APP_URL}/payment/success`
}
