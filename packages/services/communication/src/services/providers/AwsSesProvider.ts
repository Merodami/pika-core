import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses'
import { logger } from '@pika/shared'

import type {
  BulkEmailParams,
  BulkEmailResult,
  EmailParams,
  EmailProvider,
  EmailResult,
} from './EmailProvider.js'

export class AwsSesProvider implements EmailProvider {
  private client!: SESClient
  private isConfigured: boolean

  constructor(
    private readonly config: {
      region?: string
      accessKeyId?: string
      secretAccessKey?: string
      endpoint?: string // For LocalStack testing
    },
  ) {
    this.isConfigured = !!(
      config.region &&
      (config.accessKeyId || process.env.AWS_REGION)
    )

    if (this.isConfigured) {
      this.client = new SESClient({
        region: config.region || 'us-east-1',
        ...(config.endpoint && { endpoint: config.endpoint }), // LocalStack support
        ...(config.accessKeyId &&
          config.secretAccessKey && {
            credentials: {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey,
            },
          }),
      })
    }
  }

  getProviderName(): string {
    return 'aws-ses'
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isConfigured) {
      return false
    }

    try {
      // Try to get send quota to verify credentials
      const { GetSendQuotaCommand } = await import('@aws-sdk/client-ses')

      await this.client.send(new GetSendQuotaCommand({}))

      return true
    } catch (error) {
      logger.warn('AWS SES not available', { error: error.message })

      return false
    }
  }

  async sendEmail(params: EmailParams): Promise<EmailResult> {
    if (!this.isConfigured) {
      throw new Error('AWS SES not configured')
    }

    try {
      const command = new SendEmailCommand({
        Source: params.from.name
          ? `${params.from.name} <${params.from.email}>`
          : params.from.email,
        Destination: {
          ToAddresses: [params.to],
        },
        Message: {
          Subject: {
            Data: params.subject,
            Charset: 'UTF-8',
          },
          Body: {
            ...(params.text && {
              Text: {
                Data: params.text,
                Charset: 'UTF-8',
              },
            }),
            ...(params.html && {
              Html: {
                Data: params.html,
                Charset: 'UTF-8',
              },
            }),
          },
        },
        ...(params.replyTo && { ReplyToAddresses: [params.replyTo] }),
      })

      const response = await this.client.send(command)

      return {
        success: true,
        messageId: response.MessageId!,
        provider: this.getProviderName(),
        status: 'sent',
        metadata: {
          requestId: response.$metadata.requestId,
        },
      }
    } catch (error) {
      logger.error('Failed to send email via AWS SES', error)
      throw error
    }
  }

  async sendBulkEmail(params: BulkEmailParams): Promise<BulkEmailResult> {
    const results: Array<{
      success: boolean
      messageId?: string
      error?: string
      metadata?: any
    }> = []

    // AWS SES has a limit of 50 destinations per SendBulkTemplatedEmail call
    const chunks = this.chunkArray(params.to, 50)

    for (const chunk of chunks) {
      // For now, send individually. In production, use SendBulkTemplatedEmail
      await Promise.all(
        chunk.map(async (recipient) => {
          try {
            const result = await this.sendEmail({
              to: recipient,
              from: params.from,
              fromName: params.fromName,
              subject: params.subject,
              body: params.body,
              html: params.html,
              text: params.text,
              isHtml: params.isHtml,
            })

            results.push({
              success: result.success,
              messageId: result.messageId,
              metadata: result.metadata,
            })
          } catch (error: any) {
            results.push({
              success: false,
              error: error.message,
            })
          }
        }),
      )
    }

    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    return {
      sent: successful,
      failed: failed,
      total: params.to.length,
      results,
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
