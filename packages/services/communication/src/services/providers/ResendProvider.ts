import { logger } from '@pika/shared'

import type {
  BulkEmailParams,
  BulkEmailResult,
  EmailParams,
  EmailProvider,
  EmailResult,
} from './EmailProvider.js'

/**
 * Resend Email Provider - Great for Vercel deployments
 * Modern email API that works well in serverless environments
 */
export class ResendProvider implements EmailProvider {
  private apiKey: string | undefined
  private baseUrl = 'https://api.resend.com'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.RESEND_API_KEY
  }

  getProviderName(): string {
    return 'resend'
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      return false
    }

    try {
      const response = await fetch(`${this.baseUrl}/domains`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      })

      return response.ok
    } catch (error) {
      logger.warn('Resend not available', { error: error.message })

      return false
    }
  }

  async sendEmail(params: EmailParams): Promise<EmailResult> {
    if (!this.apiKey) {
      throw new Error('Resend API key not configured')
    }

    try {
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: params.fromName
            ? `${params.fromName} <${params.from}>`
            : params.from,
          to: [params.to],
          subject: params.subject,
          html: params.html,
          text: params.text,
          reply_to: params.replyTo,
        }),
      })

      if (!response.ok) {
        const error = await response.json()

        throw new Error(error.message || 'Failed to send email via Resend')
      }

      const result = await response.json()

      return {
        success: true,
        messageId: result.id,
        provider: this.getProviderName(),
        status: 'sent',
        metadata: result,
      }
    } catch (error) {
      logger.error('Failed to send email via Resend', error)
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

    // Resend supports batch sending
    const batchSize = 100
    const chunks = this.chunkArray(params.to, batchSize)

    for (const chunk of chunks) {
      try {
        const response = await fetch(`${this.baseUrl}/emails/batch`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            chunk.map((recipient) => ({
              from: params.fromName
                ? `${params.fromName} <${params.from.email}>`
                : params.from.email,
              to: [recipient],
              subject: params.subject,
              html: params.html || params.body,
              text: params.text || (!params.isHtml ? params.body : undefined),
            })),
          ),
        })

        if (response.ok) {
          const apiResults = await response.json()

          apiResults.data.forEach((result: any) => {
            results.push({
              success: true,
              messageId: result.id,
              metadata: result,
            })
          })
        } else {
          const error = await response.json()

          chunk.forEach(() => {
            results.push({
              success: false,
              error: error.message || 'Failed to send',
            })
          })
        }
      } catch (error: any) {
        chunk.forEach(() => {
          results.push({
            success: false,
            error: error.message,
          })
        })
      }
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
