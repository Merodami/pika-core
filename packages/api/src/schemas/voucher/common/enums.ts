import {
  AdminVoucherSortBy,
  CustomerVoucherStatus,
  UserVoucherSortBy,
  VoucherBookStatus,
  VoucherBookType,
  VoucherCodeType,
  VoucherDiscountType,
  VoucherScanSource,
  VoucherScanType,
  VoucherSortBy,
  VoucherState,
} from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { createZodEnum } from '../../../common/utils/zodEnum.js'

/**
 * Voucher-specific enum schemas
 * Following the standardized pattern with Schema suffix
 */

// Voucher state schema
export const VoucherStateSchema = openapi(createZodEnum(VoucherState), {
  description: 'Current state of the voucher lifecycle',
  example: VoucherState.published,
})

// Voucher discount type schema
export const VoucherDiscountTypeSchema = openapi(
  createZodEnum(VoucherDiscountType),
  {
    description: 'Type of discount the voucher provides',
    example: VoucherDiscountType.percentage,
  },
)

// Voucher code type schema
export const VoucherCodeTypeSchema = openapi(createZodEnum(VoucherCodeType), {
  description: 'Type of voucher code',
  example: VoucherCodeType.qr,
})

// Voucher scan source schema
export const VoucherScanSourceSchema = openapi(
  createZodEnum(VoucherScanSource),
  {
    description: 'Source of the voucher scan',
    example: VoucherScanSource.camera,
  },
)

// Voucher scan type schema
export const VoucherScanTypeSchema = openapi(createZodEnum(VoucherScanType), {
  description: 'Type of voucher scan',
  example: VoucherScanType.customer,
})

// Customer voucher status schema
export const CustomerVoucherStatusSchema = openapi(
  createZodEnum(CustomerVoucherStatus),
  {
    description: 'Status of voucher from customer perspective',
    example: CustomerVoucherStatus.claimed,
  },
)

// Voucher book status schema
export const VoucherBookStatusSchema = openapi(
  createZodEnum(VoucherBookStatus),
  {
    description: 'Status of a voucher book in the publishing workflow',
    example: VoucherBookStatus.DRAFT,
  },
)

// Voucher book type schema
export const VoucherBookTypeSchema = openapi(createZodEnum(VoucherBookType), {
  description: 'Type of voucher book',
  example: VoucherBookType.MONTHLY,
})

// Voucher sorting schemas
export const VoucherSortBySchema = openapi(createZodEnum(VoucherSortBy), {
  description: 'Field to sort vouchers by',
  example: VoucherSortBy.CREATED_AT,
})

export const AdminVoucherSortBySchema = openapi(
  createZodEnum(AdminVoucherSortBy),
  {
    description: 'Admin voucher sort fields',
    example: AdminVoucherSortBy.CREATED_AT,
  },
)

export const UserVoucherSortBySchema = openapi(
  createZodEnum(UserVoucherSortBy),
  {
    description: 'User voucher sort fields',
    example: UserVoucherSortBy.CLAIMED_AT,
  },
)

// Additional schema-specific enums that don't belong in @pika/types
export const UserVoucherStatusFilter = z.enum([
  'claimed',
  'redeemed',
  'expired',
  'all',
])

export const UserVoucherStatusFilterSchema = openapi(UserVoucherStatusFilter, {
  description: 'User voucher status filter including all option',
  example: 'all',
})

export const BatchOperationType = z.enum([
  'publish',
  'expire',
  'validate',
  'refresh',
  'activate',
])

export const BatchOperationTypeSchema = openapi(BatchOperationType, {
  description: 'Type of batch operation to perform',
  example: 'publish',
})
