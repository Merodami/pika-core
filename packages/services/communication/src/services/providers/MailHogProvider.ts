import {
  MAILHOG_SMTP_HOST,
  MAILHOG_SMTP_PORT,
  MAILHOG_UI_PORT,
} from '@pika/environment'
import { logger } from '@pika/shared'
import nodemailer, { type SentMessageInfo, type Transporter } from 'nodemailer'

import { BaseEmailProvider } from './BaseEmailProvider.js'
import type { EmailParams, EmailResult } from './EmailProvider.js'

/**
 * MailHog Email Provider for development
 * Sends real emails to MailHog SMTP server for visual testing
 */
export class MailHogProvider extends BaseEmailProvider {
  private transporter: Transporter | null = null

  getProviderName(): string {
    return 'mailhog'
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.transporter) {
        await this.initializeTransporter()
      }

      if (!this.transporter) {
        return false
      }

      await this.transporter.verify()

      return true
    } catch (error) {
      logger.warn('MailHog not available', { error: (error as Error).message })

      return false
    }
  }

  private async initializeTransporter(): Promise<void> {
    this.transporter = nodemailer.createTransport({
      host: MAILHOG_SMTP_HOST,
      port: MAILHOG_SMTP_PORT,
      secure: false,
      ignoreTLS: true,
    })
  }

  async sendEmail(params: EmailParams): Promise<EmailResult> {
    try {
      if (!this.transporter) {
        await this.initializeTransporter()
      }

      if (!this.transporter) {
        throw new Error('Failed to initialize MailHog transporter')
      }

      // Handle from address properly for nodemailer
      const fromHeader =
        params.from.name || params.fromName
          ? `${params.from.name || params.fromName} <${params.from.email}>`
          : params.from.email

      const mailOptions = {
        from: fromHeader,
        to: params.to,
        subject: params.subject,
        text: params.text || (!params.isHtml ? params.body : undefined),
        html: params.html || (params.isHtml ? params.body : undefined),
        replyTo: params.replyTo,
        cc: params.cc,
        bcc: params.bcc,
      }

      const info: SentMessageInfo = await this.transporter.sendMail(mailOptions)

      logger.info('📧 EMAIL (MailHog Provider)', {
        messageId: info.messageId,
        to: params.to,
        subject: params.subject,
        mailhogUrl: `http://${MAILHOG_SMTP_HOST}:${MAILHOG_UI_PORT}/#`,
      })

      return {
        success: true,
        messageId: info.messageId,
        provider: this.getProviderName(),
        status: 'sent',
        metadata: {
          envelope: info.envelope,
          response: info.response,
          mailhogUrl: `http://${MAILHOG_SMTP_HOST}:${MAILHOG_UI_PORT}/#`,
        },
      }
    } catch (error) {
      logger.error('Failed to send email via MailHog', error)

      return {
        success: false,
        provider: this.getProviderName(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
