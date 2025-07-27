import nodemailer, { Transporter, SendMailOptions, SentMessageInfo } from "nodemailer"
import * as fs from "fs/promises"
import path from "path"
import handlebars from "../lib/handlebars"
import logger from "../lib/logger"

let transporter: Transporter | null = null
const templateCache: Record<string, (context: Record<string, any>) => string> = {}

async function init(): Promise<void> {
  try {
    const emailHost = process.env.EMAIL_HOST
    const emailPort = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : undefined
    const emailSecure = process.env.EMAIL_SECURE === "true"
    const emailUser = process.env.EMAIL_USER
    const emailPass = process.env.EMAIL_PASS
    const emailServiceType = process.env.EMAIL_SERVICE_TYPE

    if (!emailUser || !emailPass) {
      throw new Error("EMAIL_USER and EMAIL_PASS environment variables are required for email service.")
    }

    let transporterConfig: any

    if (emailHost && emailPort) {
      transporterConfig = {
        host: emailHost,
        port: emailPort,
        secure: emailSecure,
        auth: {
          user: emailUser,
          pass: emailPass
        }
      }
    } else if (emailServiceType) {
      transporterConfig = {
        service: emailServiceType,
        auth: {
          user: emailUser,
          pass: emailPass
        }
      }
    } else {
      throw new Error("Email configuration missing. Please provide EMAIL_HOST/EMAIL_PORT or EMAIL_SERVICE_TYPE.")
    }

    transporter = nodemailer.createTransport(transporterConfig)

    await transporter.verify()
    logger.info("✅ Email service initialized and connection verified successfully.")
  } catch (error: any) {
    logger.error("[EMAIL] Failed to initialize email service:", error.message, error.stack)
    throw new Error(`Email service initialization failed: ${error.message}`)
  }
}

async function sendHtmlEmail(to: string, subject: string, htmlContent: string, options: SendMailOptions = {}): Promise<SentMessageInfo> {
  if (!transporter) {
    logger.error("[EMAIL] Attempted to send email before service was initialized.")
    throw new Error("Email service not initialized. Call init() first.")
  }

  const defaultFrom = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER
  const fromName = process.env.EMAIL_FROM_NAME || "Your App"
  const fromAddress = `"${fromName}" <${defaultFrom}>`

  try {
    const mailOptions: SendMailOptions = {
      from: options.from || fromAddress,
      to,
      subject,
      html: htmlContent,
      ...options
    }

    const info = await transporter.sendMail(mailOptions)
    logger.info(`[EMAIL] HTML email sent to ${to}: ${info.messageId}`)
    return info
  } catch (error: any) {
    logger.error(`[EMAIL] Failed to send HTML email to ${to}:`, error.message, error.stack)
    throw new Error(`Failed to send email: ${error.message}`)
  }
}

async function sendTextEmail(to: string, subject: string, textContent: string, options: SendMailOptions = {}): Promise<SentMessageInfo> {
  if (!transporter) {
    logger.error("[EMAIL] Attempted to send email before service was initialized.")
    throw new Error("Email service not initialized. Call init() first.")
  }

  const defaultFrom = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER
  const fromName = process.env.EMAIL_FROM_NAME || "Your App"
  const fromAddress = `"${fromName}" <${defaultFrom}>`

  try {
    const mailOptions: SendMailOptions = {
      from: options.from || fromAddress,
      to,
      subject,
      text: textContent,
      ...options
    }

    const info = await transporter.sendMail(mailOptions)
    logger.info(`[EMAIL] Text email sent to ${to}: ${info.messageId}`)
    return info
  } catch (error: any) {
    logger.error(`[EMAIL] Failed to send text email to ${to}:`, error.message, error.stack)
    throw new Error(`Failed to send email: ${error.message}`)
  }
}

async function loadTemplate(templateName: string): Promise<(context: Record<string, any>) => string> {
  if (templateCache[templateName]) {
    return templateCache[templateName]
  }

  const templatePath = path.join(__dirname, "../templates/", `${templateName}.html`)

  try {
    const templateSource = await fs.readFile(templatePath, "utf-8")
    const compiledTemplate = handlebars.compile(templateSource)
    templateCache[templateName] = compiledTemplate
    return compiledTemplate
  } catch (error: any) {
    logger.error(`[EMAIL] Failed to load email template: ${templateName}`, error.message, error.stack)
    throw new Error(`Failed to load email template: ${templateName}. ${error.message}`)
  }
}

async function sendTemplateEmail(to: string, subject: string, templateName: string, data: Record<string, any> = {}, options: SendMailOptions = {}): Promise<SentMessageInfo> {
  try {
    const template = await loadTemplate(templateName)
    const html = template(data)
    return sendHtmlEmail(to, subject, html, options)
  } catch (error: any) {
    logger.error(`[EMAIL] Failed to send template email to ${to} using template ${templateName}:`, error.message, error.stack)
    throw new Error(`Failed to send template email: ${error.message}`)
  }
}

export default {
  init,
  sendHtmlEmail,
  sendTextEmail,
  sendTemplateEmail
}
