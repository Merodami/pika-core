import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UUID } from '../../shared/primitives.js'

/**
 * Voucher-specific path parameter schemas
 * Based on pika-old voucher operations and actual API endpoints
 *
 * Note: We import BusinessIdParam, UserIdParam, and CategoryIdParam from their respective services
 * to avoid duplication and maintain consistency
 */

/**
 * Voucher ID path parameter
 * Used in: GET/PUT/DELETE /vouchers/{id}, POST /vouchers/{id}/redeem, etc.
 */
export const VoucherIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Voucher ID path parameter',
  },
)

export type VoucherIdParam = z.infer<typeof VoucherIdParam>

/**
 * Voucher code path parameter
 * Used in: GET /vouchers/code/{code}, POST /vouchers/redeem/{code}
 */
export const VoucherCodeParam = openapi(
  z.object({
    code: z.string().max(500), // JWT tokens can be up to 500 chars
  }),
  {
    description: 'Voucher code path parameter (QR/SHORT/STATIC)',
  },
)

export type VoucherCodeParam = z.infer<typeof VoucherCodeParam>

/**
 * Customer ID path parameter
 * Used in: GET /vouchers/customer/{customerId}/wallet
 */
export const CustomerIdParam = openapi(
  z.object({
    customerId: UUID,
  }),
  {
    description: 'Customer ID path parameter',
  },
)

export type CustomerIdParam = z.infer<typeof CustomerIdParam>
