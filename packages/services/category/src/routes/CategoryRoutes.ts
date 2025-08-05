import type { CategoryController } from '@category/controllers/CategoryController.js'
import { categoryCommon, categoryPublic } from '@pika/api'
import { requireAuth, validateParams, validateQuery } from '@pika/http'
import { Router } from 'express'

/**
 * Creates public category routes
 */
export function createCategoryRoutes(
  categoryController: CategoryController,
): Router {
  const router = Router()

  // GET /categories - List categories with pagination and filtering
  router.get(
    '/',
    requireAuth(),
    validateQuery(categoryPublic.CategoryQueryParams),
    categoryController.getAllCategories,
  )

  // GET /categories/hierarchy - Get hierarchical category tree
  router.get(
    '/hierarchy',
    requireAuth(),
    validateQuery(categoryPublic.CategoryHierarchyQuery),
    categoryController.getCategoryHierarchy,
  )

  // GET /categories/:id - Get category by ID
  router.get(
    '/:id',
    requireAuth(),
    validateParams(categoryCommon.CategoryIdParam),
    categoryController.getCategoryById,
  )

  // GET /categories/:id/path - Get category path (breadcrumb)
  router.get(
    '/:id/path',
    requireAuth(),
    validateParams(categoryPublic.CategoryPathParams),
    categoryController.getCategoryPath,
  )

  return router
}
