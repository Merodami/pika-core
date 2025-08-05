import type { AdminCategoryController } from '@category/controllers/AdminCategoryController.js'
import { categoryAdmin, categoryCommon } from '@pika/api'
import {
  requirePermissions,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import { Router } from 'express'

/**
 * Creates admin category routes
 */
export function createAdminCategoryRoutes(
  adminCategoryController: AdminCategoryController,
): Router {
  const router = Router()

  // GET /admin/categories - List categories with admin filters
  router.get(
    '/',
    requirePermissions('admin:categories'),
    validateQuery(categoryAdmin.AdminCategoryQueryParams),
    adminCategoryController.getAllCategories,
  )

  // GET /admin/categories/hierarchy - Get hierarchical category tree for admin
  router.get(
    '/hierarchy',
    requirePermissions('admin:categories'),
    adminCategoryController.getCategoryHierarchy,
  )

  // GET /admin/categories/:id - Get category by ID for admin
  router.get(
    '/:id',
    requirePermissions('admin:categories'),
    validateParams(categoryCommon.CategoryIdParam),
    adminCategoryController.getCategoryById,
  )

  // POST /admin/categories - Create new category
  router.post(
    '/',
    requirePermissions('admin:categories'),
    validateBody(categoryAdmin.CreateCategoryRequest),
    adminCategoryController.createCategory,
  )

  // PATCH /admin/categories/:id - Update category
  router.patch(
    '/:id',
    requirePermissions('admin:categories'),
    validateParams(categoryCommon.CategoryIdParam),
    validateBody(categoryAdmin.UpdateCategoryRequest),
    adminCategoryController.updateCategory,
  )

  // DELETE /admin/categories/:id - Delete category
  router.delete(
    '/:id',
    requirePermissions('admin:categories'),
    validateParams(categoryCommon.CategoryIdParam),
    adminCategoryController.deleteCategory,
  )

  // POST /admin/categories/:id/toggle-status - Toggle active/inactive
  router.post(
    '/:id/toggle-status',
    requirePermissions('admin:categories'),
    validateParams(categoryCommon.CategoryIdParam),
    adminCategoryController.toggleCategoryStatus,
  )

  // POST /admin/categories/:id/move - Move category to different parent
  router.post(
    '/:id/move',
    requirePermissions('admin:categories'),
    validateParams(categoryCommon.CategoryIdParam),
    validateBody(categoryAdmin.MoveCategoryRequest),
    adminCategoryController.moveCategory,
  )

  // POST /admin/categories/:id/sort-order - Update category sort order
  router.post(
    '/:id/sort-order',
    requirePermissions('admin:categories'),
    validateParams(categoryCommon.CategoryIdParam),
    validateBody(categoryAdmin.UpdateCategorySortOrderRequest),
    adminCategoryController.updateCategorySortOrder,
  )

  // POST /admin/categories/bulk-delete - Bulk delete categories
  router.post(
    '/bulk-delete',
    requirePermissions('admin:categories'),
    validateBody(categoryAdmin.BulkDeleteCategoriesRequest),
    adminCategoryController.bulkDeleteCategories,
  )

  return router
}
