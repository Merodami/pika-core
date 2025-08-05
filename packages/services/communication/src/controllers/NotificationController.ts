import type { INotificationService } from '@communication/services/NotificationService.js'
import {
  // communicationAdmin, // TODO: Uncomment when admin schemas are available
  communicationCommon,
  communicationPublic,
} from '@pika/api'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import {
  getValidatedQuery,
  paginatedResponse,
  RequestContext,
  validateResponse,
} from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { NotificationMapper } from '@pika/sdk'
import { logger } from '@pika/shared'
import type { NextFunction, Request, Response } from 'express'

export interface INotificationController {
  /**
   * POST /notifications
   * Create a new notification
   */
  createNotification(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  getNotifications(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  getNotificationById(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  updateNotification(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  markAsRead(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  markAllAsRead(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  deleteNotification(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  // TODO: Uncomment when admin schemas are available
  /*
  createGlobalNotification(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>
  */
}

/**
 * Handles in-app notification operations
 */
export class NotificationController implements INotificationController {
  constructor(private readonly notificationService: INotificationService) {
    // Bind all methods to preserve 'this' context
    this.createNotification = this.createNotification.bind(this)
    this.getNotifications = this.getNotifications.bind(this)
    this.getNotificationById = this.getNotificationById.bind(this)
    this.updateNotification = this.updateNotification.bind(this)
    this.markAsRead = this.markAsRead.bind(this)
    this.markAllAsRead = this.markAllAsRead.bind(this)
    this.deleteNotification = this.deleteNotification.bind(this)
    // this.createGlobalNotification = this.createGlobalNotification.bind(this) // TODO: Uncomment when admin functionality is ready
  }

  /**
   * POST /notifications
   * Create a new notification
   */
  async createNotification(
    request: Request<{}, {}, communicationPublic.CreateNotificationRequest>,
    response: Response<communicationPublic.NotificationResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = request.body
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Creating notification', {
        userId,
        type: data.type,
      })

      const notification = await this.notificationService.createNotification({
        ...data,
        userId: data.userId || userId,
      })

      const responseData = NotificationMapper.toDTO(notification)
      const validatedResponse = validateResponse(
        communicationPublic.NotificationResponse,
        responseData,
        'NotificationController.createNotification',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /notifications
   * Get user's notifications
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'notifications',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getNotifications(
    request: Request, // Standard pattern - don't use Query params on Request
    response: Response<communicationPublic.NotificationListResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(request)
      const userId = context.userId

      const query =
        getValidatedQuery<communicationPublic.NotificationSearchParams>(request)

      // Map API query parameters inline - standard pattern
      const params = {
        page: query.page || 1,
        limit: query.limit || 20,
        type: query.type,
        isRead: query.isRead,
      }

      logger.info('Getting notifications', { userId, params })

      const result = await this.notificationService.getUserNotifications(
        userId,
        params,
      )

      // Use paginatedResponse utility + validation
      const responseData = paginatedResponse(result, NotificationMapper.toDTO)
      const validatedResponse = validateResponse(
        communicationPublic.NotificationListResponse,
        responseData,
        'NotificationController.getNotifications',
      )

      response.json(validatedResponse)
    } catch (error) {
      logger.error('NotificationController.getNotifications error:', error)
      next(error)
    }
  }

  /**
   * GET /notifications/:id
   * Get notification by ID
   */
  async getNotificationById(
    request: Request<communicationCommon.NotificationIdParam>,
    response: Response<communicationPublic.NotificationResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Getting notification by ID', { id, userId })

      const notification = await this.notificationService.getNotificationById(
        id,
        userId,
      )

      const responseData = NotificationMapper.toDTO(notification)
      const validatedResponse = validateResponse(
        communicationPublic.NotificationResponse,
        responseData,
        'NotificationController.getNotificationById',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /notifications/:id
   * Update notification status
   */
  async updateNotification(
    request: Request<
      communicationCommon.NotificationIdParam,
      {},
      communicationPublic.UpdateNotificationStatusRequest
    >,
    response: Response<communicationPublic.NotificationResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const data = request.body
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Updating notification', { id, userId })

      const notification = await this.notificationService.updateNotification(
        id,
        data,
        userId,
      )

      const responseData = NotificationMapper.toDTO(notification)
      const validatedResponse = validateResponse(
        communicationPublic.NotificationResponse,
        responseData,
        'NotificationController.updateNotification',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /notifications/:id/read
   * Mark notification as read
   */
  async markAsRead(
    request: Request<communicationCommon.NotificationIdParam>,
    response: Response<communicationPublic.NotificationResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Marking notification as read', { id, userId })

      const notification = await this.notificationService.markAsRead(id, userId)

      const responseData = NotificationMapper.toDTO(notification)
      const validatedResponse = validateResponse(
        communicationPublic.NotificationResponse,
        responseData,
        'NotificationController.markAsRead',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /notifications/read-all
   * Mark all notifications as read
   */
  async markAllAsRead(
    request: Request,
    response: Response<communicationPublic.MarkAllAsReadResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Marking all notifications as read', { userId })

      const updatedCount = await this.notificationService.markAllAsRead(userId)

      const responseData = { updated: updatedCount }
      const validatedResponse = validateResponse(
        communicationPublic.MarkAllAsReadResponse,
        responseData,
        'NotificationController.markAllAsRead',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /notifications/:id
   * Delete a notification
   */
  async deleteNotification(
    request: Request<communicationCommon.NotificationIdParam>,
    response: Response<communicationPublic.DeleteNotificationResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Deleting notification', { id, userId })

      await this.notificationService.deleteNotification(id, userId)

      response.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /notifications/global
   * Create a global notification for all users
   *
   * TODO: Uncomment when admin schemas are available
   */
  /*
  async createGlobalNotification(
    request: Request<
      {},
      {},
      communicationAdmin.CreateGlobalNotificationRequest
    >,
    response: Response<communicationAdmin.CreateGlobalNotificationResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = request.body

      logger.info('Creating global notification', { type: data.type })

      // In a real implementation, global notifications would be handled differently:
      // Option 1: Store a single notification with isGlobal=true and have the UI query it
      // Option 2: Use a background job to create notifications for all users
      // Option 3: Integrate with UserService to get all active users

      // For now, we'll create a placeholder response
      // TODO: Implement proper global notification system
      const responseData = {
        count: 0,
        message: 'Global notification system not yet implemented',
      }
      const validatedResponse =
        communicationAdmin.CreateGlobalNotificationResponse.parse(responseData)

      response.status(201).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
  */
}
