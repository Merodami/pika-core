import { createSortFieldMapper } from '@api/common/utils/sorting.js'

import { AdminUserSortBySchema, UserSortBySchema } from './enums.js'

/**
 * Maps public API sort fields to database column names
 */
export const userSortFieldMapper = createSortFieldMapper(UserSortBySchema, {
  name: 'firstName', // Maps 'name' to firstName for sorting
  email: 'email',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  lastLogin: 'lastLoginAt',
})

/**
 * Maps admin API sort fields to database column names
 */
export const adminUserSortFieldMapper = createSortFieldMapper(
  AdminUserSortBySchema,
  {
    createdAt: 'createdAt',
    lastLoginAt: 'lastLoginAt',
    email: 'email',
  },
)
