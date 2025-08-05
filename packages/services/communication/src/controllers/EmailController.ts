import type {
  BulkEmailInput,
  IEmailService,
  SendEmailInput,
} from '@communication/services/EmailService.js'
import { communicationCommon, communicationPublic } from '@pika/api'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import {
  getValidatedQuery,
  paginatedResponse,
  RequestContext,
  validateResponse,
} from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { CommunicationLogMapper } from '@pika/sdk'
import { logger } from '@pika/shared'
import type { NextFunction, Request, Response } from 'express'

export interface IEmailController {
  sendEmail(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  sendBulkEmail(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  getEmailHistory(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  getEmailById(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>
}

/**
 * Handles email communication operations
 */
export class EmailController implements IEmailController {
  constructor(private readonly emailService: IEmailService) {
    // Bind all methods to preserve 'this' context
    this.sendEmail = this.sendEmail.bind(this)
    this.sendBulkEmail = this.sendBulkEmail.bind(this)
    this.getEmailHistory = this.getEmailHistory.bind(this)
    this.getEmailById = this.getEmailById.bind(this)
  }

  /**
   * POST /email/send
   * Send an email to a single recipient
   */
  async sendEmail(
    request: Request<{}, {}, communicationPublic.SendEmailRequest>,
    response: Response<communicationPublic.SendEmailResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = request.body
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Email send request', {
        to: data.to,
        templateId: data.templateId,
        userId,
      })

      // Transform API request to service input
      const emailInput: SendEmailInput = {
        to:
          typeof data.to === 'string'
            ? data.to
            : data.to.map((r) => r.email).join(','),
        subject: data.subject,
        templateId: data.templateId,
        templateParams: data.templateParams,
        body: data.body || data.textContent,
        isHtml: data.isHtml || !!data.htmlContent,
        userId,
      }

      const result = await this.emailService.sendEmail(emailInput)

      const responseData = {
        messageId: result.id, // Use the communication log ID as messageId
        status: result.status as any, // Cast to match EmailStatus
        queuedAt: result.createdAt,
        scheduledAt: result.sentAt || undefined,
      }
      const validatedResponse = validateResponse(
        communicationPublic.SendEmailResponse,
        responseData,
        'EmailController.sendEmail',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /email/send-bulk
   * Send emails to multiple recipients
   */
  async sendBulkEmail(
    request: Request<{}, {}, communicationPublic.SendBulkEmailRequest>,
    response: Response<communicationPublic.SendBulkEmailResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = request.body
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Bulk email send request', {
        recipientCount: data.recipients.length,
        templateId: data.templateId,
        userId,
      })

      // Transform API request to service input
      const bulkEmailInput: BulkEmailInput = {
        to: data.recipients.map((r) => r.email),
        subject: data.subject,
        templateId: data.templateId,
        templateParams: data.globalVariables,
        userId,
      }

      const result = await this.emailService.sendBulkEmail(bulkEmailInput)

      const responseData = {
        sent: result.sent,
        failed: result.failed,
        total: result.total,
        logs: result.logs.map(CommunicationLogMapper.toDTO),
      }
      const validatedResponse = validateResponse(
        communicationPublic.SendBulkEmailResponse,
        responseData,
        'EmailController.sendBulkEmail',
      )

      response.status(201).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /email/history
   * Get email communication history
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'email-history',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getEmailHistory(
    request: Request, // Standard pattern - don't use Query params on Request
    response: Response<communicationPublic.CommunicationLogListResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(request)
      const userId = context.userId

      const query =
        getValidatedQuery<communicationPublic.CommunicationLogSearchParams>(
          request,
        )

      // Map API query parameters inline - standard pattern
      const params = {
        page: query.page || 1,
        limit: query.limit || 20,
        status: query.status,
        recipient: query.recipient,
        fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
        toDate: query.toDate ? new Date(query.toDate) : undefined,
        sortBy: query.sortBy || 'createdAt',
        sortOrder: query.sortOrder || 'desc',
      }

      logger.info('Getting email history', { userId, params })

      const result = await this.emailService.getEmailHistory(userId, params)

      const responseData = paginatedResponse(
        result,
        CommunicationLogMapper.toDTO,
      )
      const validatedResponse = validateResponse(
        communicationPublic.CommunicationLogListResponse,
        responseData,
        'EmailController.getEmailHistory',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /email/history/:id
   * Get specific email details by ID
   */
  async getEmailById(
    request: Request<communicationCommon.CommunicationLogIdParam>,
    response: Response<communicationPublic.CommunicationLogResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Getting email by ID', { id, userId })

      const email = await this.emailService.getEmailById(id, userId)

      const responseData = CommunicationLogMapper.toDTO(email)
      const validatedResponse = validateResponse(
        communicationPublic.CommunicationLogResponse,
        responseData,
        'EmailController.getEmailById',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
