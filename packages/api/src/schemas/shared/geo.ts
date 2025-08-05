import { z } from 'zod'

import { openapi } from '../../common/utils/openapi.js'

/**
 * Geographic schemas for location-based features
 */

// ============= Geo Point =============

/**
 * Geographic coordinates
 */
export const GeoPoint = openapi(
  z.object({
    lat: z.number().min(-90).max(90).describe('Latitude'),
    lng: z.number().min(-180).max(180).describe('Longitude'),
  }),
  {
    description: 'Geographic point with latitude and longitude',
  },
)

export type GeoPoint = z.infer<typeof GeoPoint>

// ============= Geo Radius =============

/**
 * Search radius for geographic queries
 */
export const GeoRadius = openapi(
  z.object({
    radius: z
      .number()
      .positive()
      .default(10)
      .describe('Search radius in kilometers'),
    unit: z
      .enum(['KM', 'MI'])
      .default('KM')
      .optional()
      .describe('Distance unit'),
  }),
  {
    description: 'Geographic search radius',
  },
)

export type GeoRadius = z.infer<typeof GeoRadius>

// ============= Geo Search =============

/**
 * Complete geographic search parameters
 */
export const GeoSearch = openapi(
  z.object({
    lat: z.number().min(-90).max(90).describe('Search center latitude'),
    lng: z.number().min(-180).max(180).describe('Search center longitude'),
    radius: z.number().positive().default(10).describe('Search radius'),
    unit: z
      .enum(['KM', 'MI'])
      .default('KM')
      .optional()
      .describe('Distance unit'),
  }),
  {
    description: 'Geographic search with center point and radius',
  },
)

export type GeoSearch = z.infer<typeof GeoSearch>

// ============= Geo Bounds =============

/**
 * Geographic bounding box
 */
export const GeoBounds = openapi(
  z.object({
    northeast: GeoPoint.describe('Northeast corner of the bounding box'),
    southwest: GeoPoint.describe('Southwest corner of the bounding box'),
  }),
  {
    description: 'Geographic bounding box',
  },
)

export type GeoBounds = z.infer<typeof GeoBounds>

// ============= Address =============

/**
 * Physical address
 */
export const Address = openapi(
  z.object({
    street: z.string().min(1).max(255),
    street2: z.string().max(255).optional().describe('Apartment, suite, etc.'),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100).describe('State or province'),
    postalCode: z.string().min(1).max(20),
    country: z.string().length(2).describe('ISO 3166-1 alpha-2 country code'),

    // Optional geo coordinates
    coordinates: GeoPoint.optional(),
  }),
  {
    description: 'Physical address with optional coordinates',
  },
)

export type Address = z.infer<typeof Address>

// ============= Distance Calculation =============

/**
 * Distance between two points
 */
export const Distance = z.object({
  value: z.number().nonnegative().describe('Distance value'),
  unit: z.enum(['KM', 'MI']).describe('Distance unit'),
})

export type Distance = z.infer<typeof Distance>

// ============= Location with Distance =============

/**
 * Location result with distance from search point
 */
export function locationWithDistance<T extends z.ZodObject<any>>(schema: T) {
  return schema.extend({
    distance: Distance.optional().describe('Distance from search center'),
  })
}
