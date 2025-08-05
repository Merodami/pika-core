import { AuthController } from '@auth-service/controllers/AuthController.js'
import { AuthService } from '@auth-service/services/AuthService.js'
import { authPublic } from '@pika/api'
import { requireAuth, validateBody, validateParams } from '@pika/http'
import type { ICacheService } from '@pika/redis'
import { CommunicationServiceClient, UserServiceClient } from '@pika/shared'
import { Router } from 'express'

export function createAuthRouter(
  cache: ICacheService,
  userServiceClient: UserServiceClient,
  communicationClient?: CommunicationServiceClient,
): Router {
  const router = Router()

  // Initialize dependencies using manual DI pattern
  const authService = new AuthService(
    cache,
    userServiceClient,
    communicationClient,
  )
  const controller = new AuthController(authService)

  // Public routes (no authentication required)
  router.post(
    '/register',
    validateBody(authPublic.RegisterRequest),
    controller.register,
  )

  // Password reset routes (public)
  router.post(
    '/forgot-password',
    validateBody(authPublic.ForgotPasswordRequest),
    controller.forgotPassword,
  )

  router.post(
    '/reset-password',
    validateBody(authPublic.ResetPasswordRequest),
    controller.resetPassword,
  )

  // Email verification routes (public)
  router.get(
    '/verify-email/:token',
    validateParams(authPublic.VerifyEmailRequest),
    controller.verifyEmail,
  )

  router.post(
    '/resend-verification',
    validateBody(authPublic.ForgotPasswordRequest), // Reuse same schema (only email field)
    controller.resendVerificationEmail,
  )

  // Protected routes (authentication required)
  router.post(
    '/change-password',
    requireAuth(),
    validateBody(authPublic.ChangePasswordRequest),
    controller.changePassword,
  )

  // OAuth 2.0 standard endpoints
  router.post('/token', validateBody(authPublic.TokenRequest), controller.token)

  router.post(
    '/introspect',
    validateBody(authPublic.IntrospectRequest),
    controller.introspect,
  )

  router.post(
    '/revoke',
    validateBody(authPublic.RevokeTokenRequest),
    controller.revoke,
  )

  // Protected route - auth is handled manually in the controller
  router.get('/userinfo', controller.userinfo)

  return router
}
