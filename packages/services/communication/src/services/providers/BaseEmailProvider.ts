import { get, isEmpty } from 'lodash-es'

import type {
  BulkEmailParams,
  BulkEmailResult,
  EmailParams,
  EmailProvider,
  EmailResult,
} from './EmailProvider.js'

/**
 * Base class for email providers with common bulk email functionality
 */
export abstract class BaseEmailProvider implements EmailProvider {
  abstract sendEmail(params: EmailParams): Promise<EmailResult>
  abstract getProviderName(): string
  abstract isAvailable(): Promise<boolean>

  /**
   * Default bulk email implementation that sends individual emails
   * Can be overridden by providers that support native bulk sending
   */
  async sendBulkEmail(params: BulkEmailParams): Promise<BulkEmailResult> {
    const results: Array<{
      success: boolean
      messageId?: string
      error?: string
      metadata?: any
    }> = []

    for (const [index, recipient] of params.to.entries()) {
      // Get variables for this recipient if available
      const variables = get(params.templateVariables, index, {})

      // Personalize email content with template variables
      const personalizedParams = this.personalizeEmail(
        {
          to: recipient,
          from: params.from,
          fromName: params.fromName,
          subject: params.subject,
          body: params.body,
          html: params.html,
          text: params.text,
          isHtml: params.isHtml,
          replyTo: params.replyTo,
        },
        variables,
      )

      const result = await this.sendEmail(personalizedParams)

      results.push({
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        metadata: result.metadata,
      })
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

  /**
   * Personalize email content with template variables
   * Can be overridden for more sophisticated templating
   */
  protected personalizeEmail(
    params: EmailParams,
    variables: Record<string, any>,
  ): EmailParams {
    if (isEmpty(variables)) {
      return params
    }

    let { subject, html, text } = params

    // Simple variable substitution
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`
      const replaceValue = String(value)

      subject = subject?.split(placeholder).join(replaceValue)
      html = html?.split(placeholder).join(replaceValue)
      text = text?.split(placeholder).join(replaceValue)
    }

    return {
      ...params,
      subject,
      html,
      text,
    }
  }
}
