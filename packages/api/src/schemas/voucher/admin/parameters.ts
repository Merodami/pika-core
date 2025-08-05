import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UUID } from '../../shared/primitives.js'

/**
 * Path parameter schemas for voucher admin routes
 */

/**
 * Voucher code ID path parameter
 * Used in admin endpoints for managing voucher codes
 */
export const VoucherCodeIdParam = openapi(
  z.object({
    codeId: UUID,
  }),
  {
    description: 'Voucher code ID path parameter',
  },
)

export type VoucherCodeIdParam = z.infer<typeof VoucherCodeIdParam>

/**
 * Redemption ID path parameter
 * Used in admin endpoints for managing redemptions
 */
export const RedemptionIdParam = openapi(
  z.object({
    redemptionId: UUID,
  }),
  {
    description: 'Redemption ID path parameter',
  },
)

export type RedemptionIdParam = z.infer<typeof RedemptionIdParam>
