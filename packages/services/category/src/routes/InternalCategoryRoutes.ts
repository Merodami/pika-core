import type { InternalCategoryController } from '@category/controllers/InternalCategoryController.js'
import { categoryCommon, categoryInternal } from '@pika/api'
import {
  requireServiceAuth,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import { Router } from 'express'

/**
 * Creates internal category routes for service-to-service communication
 */
export function createInternalCategoryRoutes(
  internalCategoryController: InternalCategoryController,
): Router {
  const router = Router()

  // All routes require internal authentication
  router.use(requireServiceAuth())

  // GET /internal/categories - List categories for internal use
  router.get(
    '/',
    validateQuery(categoryInternal.InternalCategoryQueryParams),
    internalCategoryController.getAllCategories,
  )

  // GET /internal/categories/hierarchy - Get category hierarchy for internal use
  // IMPORTANT: This must come BEFORE /:id route to avoid route matching issues
  router.get('/hierarchy', internalCategoryController.getCategoryHierarchy)

  // GET /internal/categories/:id - Get category by ID for internal use
  router.get(
    '/:id',
    validateParams(categoryCommon.CategoryIdParam),
    internalCategoryController.getCategoryById,
  )

  // POST /internal/categories/validate - Validate category existence
  router.post(
    '/validate',
    validateBody(categoryInternal.ValidateCategoryRequest),
    internalCategoryController.validateCategories,
  )

  // POST /internal/categories/bulk - Get multiple categories by IDs
  router.post(
    '/bulk',
    validateBody(categoryInternal.BulkCategoryRequest),
    internalCategoryController.getCategoriesByIds,
  )

  return router
}
