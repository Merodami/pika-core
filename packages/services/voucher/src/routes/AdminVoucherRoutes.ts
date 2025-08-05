import { businessCommon, voucherAdmin, voucherCommon } from '@pika/api'
import {
  createMulterMiddleware,
  requirePermissions,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import {
  BusinessServiceClient,
  CommunicationServiceClient,
  FileStoragePort,
} from '@pika/shared'
import type { TranslationClient, TranslationResolver } from '@pika/translation'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

import { AdminVoucherController } from '../controllers/AdminVoucherController.js'
import { AdminVoucherRepository } from '../repositories/AdminVoucherRepository.js'
import { AdminVoucherService } from '../services/AdminVoucherService.js'

/**
 * Creates admin voucher routes
 */
export function createAdminVoucherRoutes(
  prisma: PrismaClient,
  cache: ICacheService,
  translationClient: TranslationClient,
  translationResolver: TranslationResolver,
  fileStorage: FileStoragePort,
  communicationClient?: CommunicationServiceClient,
  businessServiceClient?: BusinessServiceClient,
): Router {
  const router = Router()

  // Initialize dependencies
  const repository = new AdminVoucherRepository(prisma, cache)
  const service = new AdminVoucherService(
    repository,
    cache,
    translationClient,
    translationResolver,
    fileStorage,
    businessServiceClient,
  )
  const controller = new AdminVoucherController(service)

  // All admin routes require admin permissions
  router.use(requirePermissions('admin:vouchers'))

  // GET /admin/vouchers - Get all vouchers with admin filters
  router.get(
    '/',
    validateQuery(voucherAdmin.AdminVoucherQueryParams),
    controller.getAllVouchers,
  )

  // PUT /admin/vouchers/bulk - Bulk update vouchers (must be before /:id)
  router.put(
    '/bulk',
    validateBody(voucherAdmin.BulkVoucherUpdateRequest),
    controller.bulkUpdateVouchers,
  )

  // GET /admin/vouchers/business/:id/stats - Get business voucher statistics (must be before /:id)
  router.get(
    '/business/:id/stats',
    validateParams(businessCommon.BusinessIdParam),
    validateQuery(voucherAdmin.BusinessVoucherStatsQueryParams),
    controller.getBusinessVoucherStats,
  )

  // GET /admin/vouchers/:id - Get voucher by ID with full details
  router.get(
    '/:id',
    validateParams(voucherCommon.VoucherIdParam),
    validateQuery(voucherAdmin.AdminVoucherQueryParams),
    controller.getVoucherById,
  )

  // POST /admin/vouchers - Create new voucher
  router.post(
    '/',
    validateBody(voucherAdmin.CreateVoucherRequest),
    controller.createVoucher,
  )

  // PATCH /admin/vouchers/:id - Update voucher
  router.patch(
    '/:id',
    validateParams(voucherCommon.VoucherIdParam),
    validateBody(voucherAdmin.UpdateVoucherRequest),
    controller.updateVoucher,
  )

  // DELETE /admin/vouchers/:id - Delete voucher
  router.delete(
    '/:id',
    validateParams(voucherCommon.VoucherIdParam),
    controller.deleteVoucher,
  )

  // PUT /admin/vouchers/:id/state - Update voucher state
  router.put(
    '/:id/state',
    validateParams(voucherCommon.VoucherIdParam),
    validateBody(voucherAdmin.UpdateVoucherStateRequest),
    controller.updateVoucherState,
  )

  // POST /admin/vouchers/:id/codes - Generate voucher codes
  router.post(
    '/:id/codes',
    validateParams(voucherCommon.VoucherIdParam),
    validateBody(voucherAdmin.GenerateVoucherCodesRequest),
    controller.generateVoucherCodes,
  )

  // Image upload route with multer middleware
  const upload = createMulterMiddleware({
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit for voucher images
    },
  })

  // POST /admin/vouchers/:id/image - Upload voucher image
  router.post(
    '/:id/image',
    validateParams(voucherCommon.VoucherIdParam),
    upload.single('image'),
    controller.uploadVoucherImage,
  )

  // PUT /admin/vouchers/:id/translations - Update voucher translations
  router.put(
    '/:id/translations',
    validateParams(voucherCommon.VoucherIdParam),
    validateBody(voucherAdmin.UpdateVoucherTranslationsRequest),
    controller.updateVoucherTranslations,
  )

  // GET /admin/vouchers/:id/translations - Get voucher translations
  router.get(
    '/:id/translations',
    validateParams(voucherCommon.VoucherIdParam),
    controller.getVoucherTranslations,
  )

  // GET /admin/vouchers/:id/analytics - Get voucher analytics
  router.get(
    '/:id/analytics',
    validateParams(voucherCommon.VoucherIdParam),
    validateQuery(voucherAdmin.VoucherAnalyticsQueryParams),
    controller.getVoucherAnalytics,
  )

  // POST /admin/vouchers/:id/publish - Publish voucher
  router.post(
    '/:id/publish',
    validateParams(voucherCommon.VoucherIdParam),
    controller.publishVoucher,
  )

  // POST /admin/vouchers/:id/expire - Expire voucher
  router.post(
    '/:id/expire',
    validateParams(voucherCommon.VoucherIdParam),
    controller.expireVoucher,
  )

  return router
}
