import type {
  CommunicationLogSearchParams,
  ICommunicationLogRepository,
} from '@communication/repositories/CommunicationLogRepository.js'
import { TemplateService } from '@communication/templates/TemplateRegistry.js'
import { NODE_ENV, REDIS_DEFAULT_TTL } from '@pika/environment'
import type { ICacheService } from '@pika/redis'
import { Cache } from '@pika/redis'
import type {
  BulkEmailDTO,
  CommunicationLogDomain,
  SendEmailDTO,
} from '@pika/sdk'
import { ErrorFactory, logger } from '@pika/shared'
import type { EmailTemplateId, PaginatedResult } from '@pika/types'
import Handlebars from 'handlebars'
import { nth } from 'lodash-es'

import type {
  BulkEmailParams,
  EmailParams,
  EmailProvider,
} from './providers/EmailProvider.js'
import {
  type ProviderConfig,
  ProviderFactory,
} from './providers/ProviderFactory.js'

export interface EmailConfig {
  region: string
  accessKeyId?: string
  secretAccessKey?: string
  fromEmail: string
  fromName?: string
}

export interface SendEmailInput extends SendEmailDTO {
  userId?: string
}

export interface BulkEmailInput extends Omit<BulkEmailDTO, 'recipients'> {
  to: string[]
  userId?: string
}

export interface BulkEmailResult {
  sent: number
  failed: number
  total: number
  logs: CommunicationLogDomain[]
}

export interface IEmailService {
  sendEmail(input: SendEmailInput): Promise<CommunicationLogDomain>
  sendBulkEmail(input: BulkEmailInput): Promise<BulkEmailResult>
  getEmailHistory(
    userId: string,
    params: CommunicationLogSearchParams,
  ): Promise<PaginatedResult<CommunicationLogDomain>>
  getEmailById(id: string, userId?: string): Promise<CommunicationLogDomain>
}

export class EmailService implements IEmailService {
  private readonly providerFactory: ProviderFactory
  private readonly templateService: TemplateService

  constructor(
    private readonly communicationLogRepository: ICommunicationLogRepository,
    private readonly cache: ICacheService,
    private readonly emailConfig: EmailConfig,
  ) {
    // Initialize provider factory with configuration
    const providerConfig: ProviderConfig = {
      environment: NODE_ENV as any,
      email: {
        aws: {
          region: emailConfig.region,
          accessKeyId: emailConfig.accessKeyId,
          secretAccessKey: emailConfig.secretAccessKey,
        },
      },
    }

    this.providerFactory = new ProviderFactory(providerConfig)
    this.templateService = new TemplateService()
  }

  async sendEmail(input: SendEmailInput): Promise<CommunicationLogDomain> {
    const startTime = Date.now()

    let emailProvider: EmailProvider | undefined

    try {
      // Get email provider
      emailProvider = await this.providerFactory.getEmailProvider()
      logger.info('Sending email', {
        provider: emailProvider.getProviderName(),
        to: input.to,
        subject: input.subject,
      })

      // Process template if templateId is provided
      let processedSubject = input.subject
      let processedBody = input.body
      let isHtmlContent = input.isHtml || false

      const templateId = input.templateId

      if (templateId) {
        // File-based template system
        const templateKey = templateId as EmailTemplateId
        const rendered = await this.templateService.renderTemplate(
          templateKey,
          {
            ...input.templateParams,
            to: input.to, // Make recipient email available to templates
          },
        )

        processedSubject = rendered.subject
        processedBody = rendered.body
        isHtmlContent = true // Templates always render as HTML

        logger.info('Template rendered successfully', {
          templateId: templateKey,
          hasVariables: !!input.templateParams,
        })
      }

      // Prepare email parameters
      const emailParams: EmailParams = {
        to: input.to,
        subject: processedSubject || 'No Subject',
        body: processedBody || '',
        isHtml: isHtmlContent,
        from: {
          email: this.emailConfig.fromEmail,
          name: this.emailConfig.fromName,
        },
        replyTo: input.replyTo,
        cc: input.cc,
        bcc: input.bcc,
      }

      // Send email using provider
      const result = await emailProvider.sendEmail(emailParams)

      // Create communication log
      const logData = {
        type: 'email' as const,
        channel: 'email' as const,
        recipient: input.to,
        subject: processedSubject,
        body: processedBody || '',
        status: result.success ? ('sent' as const) : ('failed' as const),
        userId: input.userId,
        templateId,
        variables: input.templateParams
          ? JSON.stringify(input.templateParams)
          : undefined,
        provider: emailProvider.getProviderName(),
        externalId: result.messageId,
        metadata: {
          ...(result.metadata || {}),
          templateId: templateId,
          templateParams: input.templateParams,
          cc: input.cc,
          bcc: input.bcc,
        },
        sentAt: result.success ? new Date() : undefined,
        errorMessage: result.error,
        processingTimeMs: Date.now() - startTime,
      }

      const communicationLog =
        await this.communicationLogRepository.create(logData)

      if (!result.success) {
        throw ErrorFactory.badRequest(
          'Email sending failed: ' + (result.error || 'Unknown error'),
        )
      }

      logger.info('Email sent successfully', {
        messageId: result.messageId,
        provider: emailProvider.getProviderName(),
        processingTime: Date.now() - startTime,
      })

      return communicationLog
    } catch (error) {
      logger.error('Failed to send email', error)

      // Create failed communication log
      try {
        const logData = {
          type: 'email' as const,
          channel: 'email' as const,
          recipient: input.to,
          subject: input.subject,
          body: input.body,
          status: 'failed' as const,
          userId: input.userId,
          templateId: input.templateId,
          variables: input.templateParams
            ? JSON.stringify(input.templateParams)
            : undefined,
          provider: emailProvider?.getProviderName() || 'unknown',
          metadata: {
            templateId: input.templateId,
            templateParams: input.templateParams,
            cc: input.cc,
            bcc: input.bcc,
          },
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
          processingTimeMs: Date.now() - startTime,
        }

        const communicationLog =
          await this.communicationLogRepository.create(logData)

        return communicationLog
      } catch (logError) {
        logger.error('Failed to create communication log', logError)
      }

      throw ErrorFactory.fromError(error)
    }
  }

  async sendBulkEmail(input: BulkEmailInput): Promise<BulkEmailResult> {
    const startTime = Date.now()

    let emailProvider: EmailProvider | undefined

    try {
      // Get email provider
      emailProvider = await this.providerFactory.getEmailProvider()
      logger.info('Sending bulk email', {
        provider: emailProvider.getProviderName(),
        recipientCount: input.to.length,
        subject: input.subject,
      })

      // Process template if templateId is provided
      let processedSubject = input.subject
      let processedBody = input.body

      const templateId = input.templateId

      if (templateId) {
        // File-based template system for bulk email
        const templateKey = templateId as EmailTemplateId
        const rendered = await this.templateService.renderTemplate(
          templateKey,
          // For bulk email, use first recipient's variables for base template
          input.templateVariables?.[0] || {},
        )

        processedSubject = rendered.subject
        processedBody = rendered.body

        logger.info('Bulk email template rendered successfully', {
          templateId: templateKey,
          recipientCount: input.to.length,
        })
      }

      // Prepare bulk email parameters
      const bulkParams: BulkEmailParams = {
        to: input.to,
        subject: processedSubject,
        body: processedBody || '',
        isHtml: input.isHtml,
        from: {
          email: this.emailConfig.fromEmail,
          name: this.emailConfig.fromName,
        },
        replyTo: input.replyTo,
        templateVariables: input.templateVariables,
      }

      // Send bulk email using provider
      const result = await emailProvider.sendBulkEmail(bulkParams)

      // Create communication logs for all recipients
      const logs: CommunicationLogDomain[] = []

      for (let i = 0; i < input.to.length; i++) {
        const recipient = nth(input.to, i)!
        const recipientResult = nth(result.results, i) || {
          success: false,
          messageId: '',
          error: 'No result available',
          metadata: undefined,
        }
        const variables = nth(input.templateVariables, i) || undefined

        // Render personalized content if variables provided
        let personalizedSubject = processedSubject
        let personalizedBody = processedBody

        if (variables && templateId) {
          const subjectTemplate = Handlebars.compile(processedSubject)
          const bodyTemplate = Handlebars.compile(processedBody)

          personalizedSubject = subjectTemplate(variables)
          personalizedBody = bodyTemplate(variables)
        }

        const logData = {
          type: 'email' as const,
          channel: 'email' as const,
          recipient,
          subject: personalizedSubject,
          body: personalizedBody,
          status: recipientResult.success
            ? ('sent' as const)
            : ('failed' as const),
          userId: input.userId,
          templateId,
          variables: variables ? JSON.stringify(variables) : undefined,
          provider: emailProvider.getProviderName(),
          externalId: recipientResult.messageId,
          metadata: recipientResult.metadata,
          sentAt: recipientResult.success ? new Date() : undefined,
          errorMessage: recipientResult.error,
          processingTimeMs: Date.now() - startTime,
        }

        const log = await this.communicationLogRepository.create(logData)

        logs.push(log)
      }

      const summary = {
        sent: result.sent,
        failed: result.failed,
        total: result.total,
        logs,
      }

      logger.info('Bulk email completed', {
        ...summary,
        provider: emailProvider.getProviderName(),
        processingTime: Date.now() - startTime,
      })

      return summary
    } catch (error) {
      logger.error('Failed to send bulk email', error)
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({ ttl: REDIS_DEFAULT_TTL, prefix: 'email-history' })
  async getEmailHistory(
    userId: string,
    params: CommunicationLogSearchParams,
  ): Promise<PaginatedResult<CommunicationLogDomain>> {
    const searchParams = {
      ...params,
      type: 'email' as const,
      userId,
    }

    return this.communicationLogRepository.findAll(searchParams)
  }

  async getEmailById(
    id: string,
    userId?: string,
  ): Promise<CommunicationLogDomain> {
    const email = await this.communicationLogRepository.findById(id)

    if (!email) {
      throw ErrorFactory.resourceNotFound('Email', id)
    }

    // Check access permissions
    if (userId && email.userId !== userId) {
      throw ErrorFactory.forbidden('Access denied')
    }

    return email
  }
}
