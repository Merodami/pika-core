import { Router } from 'express'

import { AuthController } from '../controllers/AuthController.js'

/**
 * Create authentication routes
 * Defines HTTP routes for authentication operations
 * Note: Validation middleware should be applied by the service that uses this router
 */
export function createAuthRouter(authController: AuthController): Router {
  const router = Router()

  // Login endpoint
  router.post('/login', authController.login.bind(authController))

  // Register endpoint
  router.post('/register', authController.register.bind(authController))

  // Refresh token endpoint
  router.post('/refresh', authController.refreshToken.bind(authController))

  // Logout endpoint
  router.post('/logout', authController.logout.bind(authController))

  return router
}
