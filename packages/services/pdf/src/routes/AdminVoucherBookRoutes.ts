import { pdfAdmin, pdfCommon } from '@pika/api'
import {
  requireAuth,
  requirePermissions,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import { Router } from 'express'

import type { AdminVoucherBookController } from '../controllers/AdminVoucherBookController.js'

/**
 * Creates admin voucher book routes (full CRUD)
 */
export function createAdminVoucherBookRoutes(
  adminVoucherBookController: AdminVoucherBookController,
): Router {
  const router = Router()

  // All routes require authentication
  router.use(requireAuth())

  // GET /admin/voucher-books/statistics - Get voucher book statistics (before parameterized routes)
  router.get(
    '/statistics',
    requirePermissions('admin:voucher'),
    validateQuery(pdfAdmin.VoucherBookStatsQueryParams),
    adminVoucherBookController.getVoucherBookStatistics,
  )

  // GET /admin/voucher-books - List voucher books with admin filters
  router.get(
    '/',
    requirePermissions('admin:voucher'),
    validateQuery(pdfAdmin.AdminVoucherBookQueryParams),
    adminVoucherBookController.getAllVoucherBooks,
  )

  // GET /admin/voucher-books/:id - Get voucher book by ID for admin
  router.get(
    '/:id',
    requirePermissions('admin:voucher'),
    validateParams(pdfCommon.VoucherBookIdParam),
    adminVoucherBookController.getVoucherBookById,
  )

  // POST /admin/voucher-books - Create new voucher book
  router.post(
    '/',
    requirePermissions('admin:voucher'),
    validateBody(pdfAdmin.CreateVoucherBookRequest),
    adminVoucherBookController.createVoucherBook,
  )

  // PATCH /admin/voucher-books/:id - Update voucher book
  router.patch(
    '/:id',
    requirePermissions('admin:voucher'),
    validateParams(pdfCommon.VoucherBookIdParam),
    validateBody(pdfAdmin.UpdateVoucherBookRequest),
    adminVoucherBookController.updateVoucherBook,
  )

  // DELETE /admin/voucher-books/:id - Delete voucher book (soft delete)
  router.delete(
    '/:id',
    requirePermissions('admin:voucher'),
    validateParams(pdfCommon.VoucherBookIdParam),
    adminVoucherBookController.deleteVoucherBook,
  )

  // POST /admin/voucher-books/:id/status - Update voucher book status
  router.post(
    '/:id/status',
    requirePermissions('admin:voucher'),
    validateParams(pdfCommon.VoucherBookIdParam),
    validateBody(pdfAdmin.UpdateVoucherBookStatusRequest),
    adminVoucherBookController.updateVoucherBookStatus,
  )

  // POST /admin/voucher-books/:id/generate-pdf - Generate PDF for voucher book
  router.post(
    '/:id/generate-pdf',
    requirePermissions('admin:voucher'),
    validateParams(pdfCommon.VoucherBookIdParam),
    validateBody(pdfAdmin.GeneratePdfRequest),
    adminVoucherBookController.generatePDF,
  )

  // POST /admin/voucher-books/bulk-archive - Bulk archive voucher books
  router.post(
    '/bulk-archive',
    requirePermissions('admin:voucher'),
    validateBody(pdfAdmin.BulkArchiveVoucherBooksRequest),
    adminVoucherBookController.bulkArchiveVoucherBooks,
  )

  return router
}
