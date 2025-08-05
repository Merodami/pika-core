import { createSortFieldMapper } from '@api/common/utils/sorting.js'

import { AdminBusinessSortBy, BusinessSortBy } from './enums.js'

/**
 * Maps public API sort fields to database column names
 */
export const businessSortFieldMapper = createSortFieldMapper(BusinessSortBy, {
  businessName: 'businessNameKey',
  avgRating: 'avgRating',
  verified: 'verified',
  active: 'active',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
})

/**
 * Maps admin API sort fields to database column names
 */
export const adminBusinessSortFieldMapper = createSortFieldMapper(
  AdminBusinessSortBy,
  {
    businessName: 'businessNameKey',
    avgRating: 'avgRating',
    verified: 'verified',
    active: 'active',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    userId: 'userId',
    categoryId: 'categoryId',
  },
)
