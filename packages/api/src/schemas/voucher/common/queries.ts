import { z } from 'zod'

/**
 * Common query parameter patterns for voucher service
 * These are shared between public and admin tiers
 */

/**
 * Geographic search parameters
 * Used for location-based voucher queries
 */
export const GeographicSearchParams = z.object({
  latitude: z
    .number()
    .min(-90)
    .max(90)
    .optional()
    .describe('Latitude for geospatial search'),
  longitude: z
    .number()
    .min(-180)
    .max(180)
    .optional()
    .describe('Longitude for geospatial search'),
  radius: z
    .number()
    .positive()
    .max(50000)
    .optional()
    .describe('Search radius in meters'),
})

export type GeographicSearchParams = z.infer<typeof GeographicSearchParams>

/**
 * Voucher filter parameters
 * Common filters used across tiers
 */
export const VoucherFilterParams = z.object({
  isActive: z.boolean().optional().describe('Filter by active status'),
  isExpired: z.boolean().optional().describe('Filter by expired status'),
  hasLocation: z.boolean().optional().describe('Filter vouchers with location'),
  hasImage: z.boolean().optional().describe('Filter vouchers with image'),
})

export type VoucherFilterParams = z.infer<typeof VoucherFilterParams>
