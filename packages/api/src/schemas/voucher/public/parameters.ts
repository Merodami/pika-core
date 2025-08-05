import { z } from 'zod'

import { UUID } from '../../shared/primitives.js'

/**
 * Path parameter schemas for voucher public routes
 */

/**
 * Voucher path parameters
 * Used in: GET /vouchers/{id}
 */
export const VoucherPathParams = z.object({
  id: UUID.describe('Voucher ID'),
})

export type VoucherPathParams = z.infer<typeof VoucherPathParams>
