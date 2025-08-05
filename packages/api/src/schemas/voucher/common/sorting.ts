import { createSortFieldMapper } from '@api/common/utils/sorting.js'

import { AdminVoucherSortBySchema, VoucherSortBySchema } from './enums.js'

/**
 * Maps public API sort fields to database column names
 */
export const voucherSortFieldMapper = createSortFieldMapper(
  VoucherSortBySchema,
  {
    title: 'titleKey', // Maps 'title' to titleKey for sorting
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    expiresAt: 'validUntil',
    discountValue: 'discount',
  },
)

/**
 * Maps admin API sort fields to database column names
 */
export const adminVoucherSortFieldMapper = createSortFieldMapper(
  AdminVoucherSortBySchema,
  {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    state: 'state',
    discountValue: 'discount',
    currentRedemptions: 'redemptionsCount',
    expiresAt: 'validUntil',
    businessId: 'businessId',
  },
)
