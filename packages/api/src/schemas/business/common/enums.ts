import {
  AdminBusinessSortBy as AdminBusinessSortByEnum,
  BusinessSortBy as BusinessSortByEnum,
  BusinessStatusFilter as BusinessStatusFilterEnum,
} from '@pika/types'
import { z } from 'zod'

import { createZodEnum } from '../../../common/utils/zodEnum.js'

/**
 * Business-specific enums and constants
 */

// Business sort fields
export const BusinessSortBy = createZodEnum(BusinessSortByEnum)

export const BusinessSortBySchema = BusinessSortBy.openapi({
  type: 'string',
  enum: Object.values(BusinessSortByEnum),
  description: 'Field to sort businesses by',
  example: BusinessSortByEnum.BUSINESS_NAME,
})

export type BusinessSortBy = z.infer<typeof BusinessSortBy>

// Business status filters
export const BusinessStatusFilter = createZodEnum(BusinessStatusFilterEnum)

export const BusinessStatusFilterSchema = BusinessStatusFilter.openapi({
  type: 'string',
  enum: Object.values(BusinessStatusFilterEnum),
  description: 'Filter businesses by status',
  example: BusinessStatusFilterEnum.ACTIVE,
})

export type BusinessStatusFilter = z.infer<typeof BusinessStatusFilter>

// Business relations that can be included
export const BUSINESS_RELATIONS = ['user', 'category'] as const

export type BusinessRelations = (typeof BUSINESS_RELATIONS)[number]

// Admin-specific sort fields
export const AdminBusinessSortBy = createZodEnum(AdminBusinessSortByEnum)

export const AdminBusinessSortBySchema = AdminBusinessSortBy.openapi({
  type: 'string',
  enum: Object.values(AdminBusinessSortByEnum),
  description: 'Field to sort businesses by (admin view)',
  example: AdminBusinessSortByEnum.BUSINESS_NAME,
})

export type AdminBusinessSortBy = z.infer<typeof AdminBusinessSortBy>
