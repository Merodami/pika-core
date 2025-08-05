import {
  PublishCommand,
  SetSMSAttributesCommand,
  SNSClient,
} from '@aws-sdk/client-sns'
import { logger } from '@pika/shared'

import type {
  BulkSmsParams,
  BulkSmsResult,
  SmsParams,
  SmsProvider,
  SmsResult,
} from './SmsProvider.js'

/**
 * AWS SNS Provider for SMS - Latest 2025 implementation
 * Supports both transactional and promotional SMS
 */
export class AwsSnsProvider implements SmsProvider {
  private client!: SNSClient
  private isConfigured: boolean

  constructor(
    private readonly config: {
      region?: string
      accessKeyId?: string
      secretAccessKey?: string
      endpoint?: string // For LocalStack testing
      defaultSenderId?: string
      smsType?: 'Transactional' | 'Promotional'
    },
  ) {
    this.isConfigured = !!(
      config.region &&
      (config.accessKeyId || process.env.AWS_REGION)
    )

    if (this.isConfigured) {
      this.client = new SNSClient({
        region: config.region || 'us-east-1',
        ...(config.endpoint && { endpoint: config.endpoint }),
        ...(config.accessKeyId &&
          config.secretAccessKey && {
            credentials: {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey,
            },
          }),
      })

      // Set default SMS attributes
      this.configureSmsDefaults()
    }
  }

  private async configureSmsDefaults(): Promise<void> {
    try {
      const command = new SetSMSAttributesCommand({
        attributes: {
          DefaultSMSType: this.config.smsType || 'Transactional',
          ...(this.config.defaultSenderId && {
            DefaultSenderID: this.config.defaultSenderId,
          }),
        },
      })

      await this.client.send(command)
    } catch (error) {
      logger.warn('Failed to set SMS defaults', { error: error.message })
    }
  }

  getProviderName(): string {
    return 'aws-sns'
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isConfigured) {
      return false
    }

    try {
      // Test with a dry run
      const { GetSMSAttributesCommand } = await import('@aws-sdk/client-sns')

      await this.client.send(new GetSMSAttributesCommand({}))

      return true
    } catch (error) {
      logger.warn('AWS SNS not available', { error: error.message })

      return false
    }
  }

  async sendSms(params: SmsParams): Promise<SmsResult> {
    if (!this.isConfigured) {
      throw new Error('AWS SNS not configured')
    }

    try {
      const command = new PublishCommand({
        PhoneNumber: params.to,
        Message: params.message,
        MessageAttributes: {
          ...(params.from && {
            'AWS.SNS.SMS.SenderID': {
              DataType: 'String',
              StringValue: params.from,
            },
          }),
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: this.config.smsType || 'Transactional',
          },
        },
      })

      const response = await this.client.send(command)

      return {
        messageId: response.MessageId!,
        provider: this.getProviderName(),
        status: 'sent',
        metadata: {
          requestId: response.$metadata.requestId,
        },
      }
    } catch (error) {
      logger.error('Failed to send SMS via AWS SNS', error)
      throw error
    }
  }

  async sendBulkSms(params: BulkSmsParams): Promise<BulkSmsResult> {
    const successful: SmsResult[] = []
    const failed: Array<{ recipient: string; error: string }> = []

    // AWS SNS PublishBatch supports up to 100 messages
    const chunks = this.chunkArray(params.recipients, 100)

    for (const chunk of chunks) {
      try {
        // Send individually as PublishBatch requires a topic
        await Promise.all(
          chunk.map(async (recipient) => {
            try {
              const result = await this.sendSms({
                to: recipient.to,
                from: params.from,
                message: recipient.message || params.defaultMessage || '',
                metadata: recipient.metadata,
              })

              successful.push(result)
            } catch (error) {
              failed.push({
                recipient: recipient.to,
                error: error.message,
              })
            }
          }),
        )
      } catch (error) {
        chunk.forEach((recipient) => {
          failed.push({
            recipient: recipient.to,
            error: error.message,
          })
        })
      }
    }

    return {
      successful,
      failed,
      provider: this.getProviderName(),
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []

    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }

    return chunks
  }
}
