import { pdfCommon, pdfPublic } from '@pika/api'
import {
  requireAuth,
  requirePermissions,
  validateParams,
  validateQuery,
} from '@pika/http'
import { Router } from 'express'

import type { VoucherBookController } from '../controllers/VoucherBookController.js'

/**
 * Creates public voucher book routes (read-only)
 */
export function createVoucherBookRoutes(
  voucherBookController: VoucherBookController,
): Router {
  const router = Router()

  // GET /voucher-books - List published voucher books with pagination and filtering
  router.get(
    '/',
    requireAuth(),
    requirePermissions('vouchers:read'),
    validateQuery(pdfPublic.VoucherBookQueryParams),
    voucherBookController.getAllVoucherBooks,
  )

  // GET /voucher-books/:id - Get published voucher book by ID
  router.get(
    '/:id',
    requireAuth(),
    requirePermissions('vouchers:read'),
    validateParams(pdfCommon.VoucherBookIdParam),
    voucherBookController.getVoucherBookById,
  )

  // GET /voucher-books/:id/download - Download PDF for published voucher book
  router.get(
    '/:id/download',
    requireAuth(),
    requirePermissions('vouchers:read'),
    validateParams(pdfCommon.VoucherBookIdParam),
    voucherBookController.downloadPDF,
  )

  return router
}
