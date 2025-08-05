import { communicationInternal } from '@pika/api'
import { COMMUNICATION_API_URL } from '@pika/environment'
import type { ServiceContext } from '@pika/types'
import { z } from 'zod'

// Use types from the communication internal namespace
type SendTransactionalEmailRequest = z.infer<
  typeof communicationInternal.SendTransactionalEmailRequest
>
type SendTransactionalEmailResponse = z.infer<
  typeof communicationInternal.SendTransactionalEmailResponse
>

import { BaseServiceClient } from '../BaseServiceClient.js'

// Communication service client types
export interface SendEmailResponse {
  messageId: string
  success: boolean
}

export interface SendSystemNotificationRequest {
  userId: string
  title: string
  message: string
  type: string
}

export interface SendSystemNotificationResponse {
  notificationId: string
  success: boolean
}

// SendTransactionalEmailRequest and SendTransactionalEmailResponse are now imported from @pika/api

export interface SendNotificationRequest {
  userId: string
  title: string
  content: string
  type: 'info' | 'warning' | 'error' | 'success'
  metadata?: Record<string, any>
}

export interface SendEmailDTO {
  to: string
  subject?: string // Optional when using templateId
  templateId?: string
  templateParams?: Record<string, any>
  body?: string
  isHtml?: boolean
  replyTo?: string
  cc?: string[]
  bcc?: string[]
}

export interface BulkEmailRequest {
  templateId: string
  recipients: Array<{
    to: string
    variables?: Record<string, any>
  }>
}

/**
 * Client for communicating with the Communication service
 * Used by other services for sending emails and notifications
 */
export class CommunicationServiceClient extends BaseServiceClient {
  constructor(serviceUrl: string = COMMUNICATION_API_URL) {
    super({
      serviceUrl,
      serviceName: 'CommunicationServiceClient',
    })
  }

  /**
   * Send a single email
   */
  async sendEmail(
    data: SendEmailDTO,
    context?: ServiceContext,
  ): Promise<SendEmailResponse> {
    return await this.post<SendEmailResponse>('/internal/emails/send', data, {
      ...context,
      useServiceAuth: true,
    })
  }

  /**
   * Send bulk emails using a template
   */
  async sendBulkEmails(
    data: BulkEmailRequest,
    context?: ServiceContext,
  ): Promise<{ sent: number; failed: number }> {
    return await this.post<{ sent: number; failed: number }>(
      '/emails/send-bulk',
      data,
      { ...context, useServiceAuth: true },
    )
  }

  /**
   * Create an in-app notification for a user
   */
  async createNotification(
    data: SendNotificationRequest,
    context?: ServiceContext,
  ): Promise<{ id: string }> {
    return await this.post<{ id: string }>('/notifications', data, {
      ...context,
      useServiceAuth: true,
    })
  }

  /**
   * Send email using a template
   */
  async sendTemplatedEmail(
    to: string,
    templateId: string,
    templateParams: Record<string, any> = {},
    subject: string,
    context?: ServiceContext,
  ): Promise<SendEmailResponse> {
    const data: SendEmailDTO = {
      to,
      templateId,
      templateParams,
      subject,
    }

    return await this.post<SendEmailResponse>('/internal/emails/send', data, {
      ...context,
      useServiceAuth: true,
    })
  }

  /**
   * Send system notification via internal API
   */
  async sendSystemNotification(
    data: SendSystemNotificationRequest,
    context?: ServiceContext,
  ): Promise<SendSystemNotificationResponse> {
    return await this.post<SendSystemNotificationResponse>(
      '/internal/notifications/system',
      data,
      { ...context, useServiceAuth: true },
    )
  }

  /**
   * Send transactional email via internal API
   */
  async sendTransactionalEmail(
    data: SendTransactionalEmailRequest,
    context?: ServiceContext,
  ): Promise<SendTransactionalEmailResponse> {
    return await this.post<SendTransactionalEmailResponse>(
      '/internal/emails/transactional',
      data,
      { ...context, useServiceAuth: true },
    )
  }
}
