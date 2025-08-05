import { voucherCommon, voucherInternal } from '@pika/api'
import { requireServiceAuth, validateBody, validateParams } from '@pika/http'
import type { ICacheService } from '@pika/redis'
import type { TranslationClient } from '@pika/translation'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

import { InternalVoucherController } from '../controllers/InternalVoucherController.js'
import { InternalVoucherRepository } from '../repositories/InternalVoucherRepository.js'
import { VoucherRepository } from '../repositories/VoucherRepository.js'
import { InternalVoucherService } from '../services/InternalVoucherService.js'

/**
 * Creates internal voucher routes for service-to-service communication
 */
export function createInternalVoucherRoutes(
  prisma: PrismaClient,
  cache: ICacheService,
  _translationClient: TranslationClient,
): Router {
  const router = Router()

  // Initialize dependencies
  const publicRepository = new VoucherRepository(prisma, cache)
  const internalRepository = new InternalVoucherRepository(prisma, cache)
  const service = new InternalVoucherService(
    internalRepository,
    publicRepository, // InternalService needs public repository for some operations
    cache,
  )
  const controller = new InternalVoucherController(service)

  // All internal routes require service authentication
  router.use(requireServiceAuth())

  // POST /internal/vouchers/by-ids - Get multiple vouchers by IDs
  router.post(
    '/by-ids',
    validateBody(voucherInternal.GetVouchersByIdsRequest),
    controller.getVouchersByIds,
  )

  // POST /internal/vouchers/validate - Validate voucher
  router.post(
    '/validate',
    validateBody(voucherInternal.ValidateVoucherRequest),
    controller.validateVoucher,
  )

  // PUT /internal/vouchers/:id/state - Internal state update
  router.put(
    '/:id/state',
    validateParams(voucherCommon.VoucherIdParam),
    validateBody(voucherInternal.InternalUpdateVoucherStateRequest),
    controller.updateVoucherState,
  )

  // POST /internal/vouchers/exists - Check voucher existence
  router.post(
    '/exists',
    validateBody(voucherInternal.CheckVoucherExistsRequest),
    controller.checkVoucherExists,
  )

  // POST /internal/vouchers/business - Get vouchers by business
  router.post(
    '/business',
    validateBody(voucherInternal.GetVouchersByBusinessRequest),
    controller.getVouchersByBusiness,
  )

  // POST /internal/vouchers/category - Get vouchers by category
  router.post(
    '/category',
    validateBody(voucherInternal.GetVouchersByCategoryRequest),
    controller.getVouchersByCategory,
  )

  // POST /internal/vouchers/user - Get user vouchers
  router.post(
    '/user',
    validateBody(voucherInternal.GetUserVouchersRequest),
    controller.getUserVouchers,
  )

  // POST /internal/vouchers/redemption - Track redemption
  router.post(
    '/redemption',
    validateBody(voucherInternal.TrackRedemptionRequest),
    controller.trackRedemption,
  )

  // POST /internal/vouchers/batch-process - Batch voucher processing
  router.post(
    '/batch-process',
    validateBody(voucherInternal.BatchVoucherProcessRequest),
    controller.batchProcessVouchers,
  )

  // POST /internal/vouchers/batch-state-update - Batch state updates
  router.post(
    '/batch-state-update',
    validateBody(voucherInternal.BatchUpdateVoucherStateRequest),
    controller.batchUpdateVoucherState,
  )

  // ============= Voucher Book Routes =============

  // POST /internal/vouchers/for-book - Get vouchers for book generation
  router.post(
    '/for-book',
    validateBody(voucherInternal.GetVouchersForBookRequest),
    controller.getVouchersForBook,
  )

  // POST /internal/vouchers/generate-tokens - Generate security tokens
  router.post(
    '/generate-tokens',
    validateBody(voucherInternal.GenerateVoucherTokensRequest),
    controller.generateVoucherTokens,
  )

  // POST /internal/vouchers/book/validate-transition - Validate book state transition
  router.post(
    '/book/validate-transition',
    validateBody(voucherInternal.ValidateBookStateTransitionRequest),
    controller.validateBookStateTransition,
  )

  return router
}
