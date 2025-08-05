import { userAdmin, userPublic } from '@pika/api'
import {
  requireAuth,
  requirePermissions,
  validateBody,
  validateParams,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import type { CommunicationServiceClient, FileStoragePort } from '@pika/shared'
import type { PrismaClient } from '@prisma/client'
import { AdminUserController } from '@user/controllers/AdminUserController.js'
import { UserRepository } from '@user/repositories/UserRepository.js'
import { InternalUserService } from '@user/services/InternalUserService.js'
import { UserService } from '@user/services/UserService.js'
import { Router } from 'express'
import multer from 'multer'

export function createAdminUserRouter(
  prisma: PrismaClient,
  cache: ICacheService,
  fileStorage: FileStoragePort,
  communicationClient?: CommunicationServiceClient,
): Router {
  const router = Router()

  // Initialize repository
  const userRepository = new UserRepository(prisma, cache)

  // Initialize internal service
  const internalUserService = new InternalUserService(userRepository, cache)

  // Initialize service with all dependencies
  const userService = new UserService(
    userRepository,
    cache,
    fileStorage,
    internalUserService,
    communicationClient,
  )

  // Initialize controller
  const controller = new AdminUserController(userService)

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  })

  // Admin verification routes
  // POST /admin/users/verify - Admin verifies any user
  router.post(
    '/verify',
    requireAuth(),
    requirePermissions('admin:users'),
    validateBody(userPublic.UnifiedVerificationRequest),
    controller.verifyUser,
  )

  // POST /admin/users/resend-verification - Admin resends verification for any user
  router.post(
    '/resend-verification',
    requireAuth(),
    requirePermissions('admin:users'),
    validateBody(userPublic.UnifiedResendVerificationRequest),
    controller.resendVerification,
  )

  // POST /admin/users/:id/avatar - Admin uploads avatar for any user
  router.post(
    '/:id/avatar',
    requireAuth(),
    requirePermissions('admin:users'),
    validateParams(userAdmin.UserIdParam),
    upload.single('file'),
    controller.uploadUserAvatar,
  )

  // Admin profile routes
  // GET /admin/users/me - Get current admin user profile
  router.get(
    '/me',
    requireAuth(),
    requirePermissions('admin:users'),
    controller.getMyProfile,
  )

  // PATCH /admin/users/me - Update current admin user profile
  router.patch(
    '/me',
    requireAuth(),
    requirePermissions('admin:users'),
    validateBody(userAdmin.UpdateAdminProfileRequest),
    controller.updateMyProfile,
  )

  // GET /admin/users/:id - Get user by ID with admin details
  router.get(
    '/:id',
    requireAuth(),
    requirePermissions('admin:users'),
    validateParams(userAdmin.UserIdParam),
    controller.getUserById,
  )

  // GET /admin/users/:id/verification-status - Get user verification status
  router.get(
    '/:id/verification-status',
    requireAuth(),
    requirePermissions('admin:users'),
    validateParams(userAdmin.UserIdParam),
    controller.getUserVerificationStatus,
  )

  // DELETE /admin/users/:id - Delete user by ID
  router.delete(
    '/:id',
    requireAuth(),
    requirePermissions('admin:users'),
    validateParams(userAdmin.UserIdParam),
    controller.deleteUser,
  )

  return router
}
