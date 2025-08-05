import type {
  BulkEmailParams,
  BulkEmailResult,
  EmailParams,
  EmailProvider,
  EmailResult,
} from '@communication/services/providers/EmailProvider.js'
import type {
  BulkSmsParams,
  BulkSmsResult,
  SmsParams,
  SmsProvider,
  SmsResult,
} from '@communication/services/providers/SmsProvider.js'
import { logger } from '@pika/shared'

export class MockEmailProvider implements EmailProvider {
  private sentEmails: any[] = []

  async sendEmail(params: EmailParams): Promise<EmailResult> {
    logger.debug('MockEmailProvider: Sending email', {
      to: params.to,
      subject: params.subject,
    })

    const messageId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    this.sentEmails.push({
      ...params,
      messageId,
      sentAt: new Date(),
    })

    return {
      success: true,
      messageId,
      provider: 'mock',
      status: 'sent',
    }
  }

  async sendBulkEmail(params: BulkEmailParams): Promise<BulkEmailResult> {
    const recipients = params.recipients || params.to || []
    const results = recipients.map((recipient) => {
      const messageId = `mock-bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      this.sentEmails.push({
        to: recipient,
        subject: params.subject,
        body: params.body,
        messageId,
        sentAt: new Date(),
      })

      return {
        success: true,
        messageId,
      }
    })

    return {
      sent: results.length,
      failed: 0,
      total: results.length,
      results,
      provider: 'mock',
    }
  }

  getProviderName(): string {
    return 'mock'
  }

  async isAvailable(): Promise<boolean> {
    return true
  }

  getSentEmails() {
    return this.sentEmails
  }

  clearSentEmails() {
    this.sentEmails = []
  }
}

export class MockSmsProvider implements SmsProvider {
  private sentMessages: any[] = []

  async sendSms(params: SmsParams): Promise<SmsResult> {
    logger.debug('MockSmsProvider: Sending SMS', { to: params.to })

    const messageId = `mock-sms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    this.sentMessages.push({
      ...params,
      messageId,
      sentAt: new Date(),
    })

    return {
      messageId,
      provider: 'mock',
      status: 'sent',
    }
  }

  async sendBulkSms(params: BulkSmsParams): Promise<BulkSmsResult> {
    const successful: SmsResult[] = []
    const failed: Array<{ recipient: string; error: string }> = []

    for (const recipient of params.recipients) {
      const messageId = `mock-bulk-sms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      this.sentMessages.push({
        to: recipient.to,
        message: recipient.message || params.defaultMessage,
        from: params.from,
        messageId,
        sentAt: new Date(),
      })

      successful.push({
        messageId,
        provider: 'mock',
        status: 'sent',
      })
    }

    return {
      successful,
      failed,
      provider: 'mock',
    }
  }

  getProviderName(): string {
    return 'mock-sms'
  }

  async isAvailable(): Promise<boolean> {
    return true
  }

  getSentMessages() {
    return this.sentMessages
  }

  clearSentMessages() {
    this.sentMessages = []
  }
}
