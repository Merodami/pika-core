import { logger } from '@pika/shared'

import type {
  BulkSmsParams,
  BulkSmsResult,
  SmsParams,
  SmsProvider,
  SmsResult,
} from './SmsProvider.js'

/**
 * Console SMS Provider for local development
 * Logs SMS messages to console instead of sending them
 */
export class ConsoleSmsProvider implements SmsProvider {
  getProviderName(): string {
    return 'console-sms'
  }

  async isAvailable(): Promise<boolean> {
    return true
  }

  async sendSms(params: SmsParams): Promise<SmsResult> {
    const messageId = `console-sms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    logger.info('📱 SMS (Console Provider)', {
      messageId,
      to: params.to,
      from: params.from || 'DEFAULT',
      messageLength: params.message.length,
      preview:
        params.message.substring(0, 50) +
        (params.message.length > 50 ? '...' : ''),
    })

    // In development, also log the full SMS content
    if (process.env.NODE_ENV === 'development') {
      console.log('\n' + '📱'.repeat(40))
      console.log('SMS MESSAGE:')
      console.log('📱'.repeat(40))
      console.log(`To: ${params.to}`)
      console.log(`From: ${params.from || 'DEFAULT'}`)
      console.log(`Message (${params.message.length} chars):`)
      console.log('-'.repeat(80))
      console.log(params.message)
      console.log('📱'.repeat(40) + '\n')
    }

    return {
      messageId,
      provider: this.getProviderName(),
      status: 'sent',
      metadata: {
        loggedAt: new Date().toISOString(),
        characterCount: params.message.length,
        segments: Math.ceil(params.message.length / 160), // SMS segment calculation
      },
    }
  }

  async sendBulkSms(params: BulkSmsParams): Promise<BulkSmsResult> {
    logger.info('📱 BULK SMS (Console Provider)', {
      recipients: params.recipients.length,
      from: params.from || 'DEFAULT',
    })

    const successful: SmsResult[] = []

    for (const recipient of params.recipients) {
      const result = await this.sendSms({
        to: recipient.to,
        from: params.from,
        message: recipient.message || params.defaultMessage || '',
        metadata: recipient.metadata,
      })

      successful.push(result)
    }

    return {
      successful,
      failed: [],
      provider: this.getProviderName(),
    }
  }
}
