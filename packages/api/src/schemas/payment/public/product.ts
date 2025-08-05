import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { Money } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { paginatedResponse } from '../../shared/responses.js'
import { Currency, PriceInterval, ProductType } from '../common/enums.js'

/**
 * Product schemas for payment service
 */

// ============= Enums =============
// Enums are now imported from ../common/enums.js

// ============= Product Schema =============

/**
 * Stripe product
 */
export const Product = openapi(
  withTimestamps({
    id: z.string().describe('Stripe product ID'),
    name: z.string().min(1).max(250),
    description: z.string().max(1000).optional(),
    active: z.boolean().default(true),
    metadata: z.record(z.string(), z.string()).optional(),
    type: ProductType.optional(),
  }),
  {
    description: 'Product information',
  },
)

export type Product = z.infer<typeof Product>

// ============= Price Schema =============

/**
 * Stripe price
 */
export const Price = openapi(
  withTimestamps({
    id: z.string().describe('Stripe price ID'),
    productId: z.string(),
    amount: Money,
    currency: Currency,
    interval: PriceInterval.optional(),
    intervalCount: z.number().int().positive().optional(),
    active: z.boolean().default(true),
    metadata: z.record(z.string(), z.string()).optional(),
  }),
  {
    description: 'Price information',
  },
)

export type Price = z.infer<typeof Price>

// ============= Create Product =============

/**
 * Create product request
 */
export const CreateProductRequest = openapi(
  z.object({
    name: z.string().min(1).max(250),
    description: z.string().max(1000).optional(),
    metadata: z.record(z.string(), z.string()).optional(),
  }),
  {
    description: 'Create a new product',
  },
)

export type CreateProductRequest = z.infer<typeof CreateProductRequest>

// ============= Update Product =============

/**
 * Update product request
 */
export const UpdateProductRequest = openapi(
  z.object({
    name: z.string().min(1).max(250).optional(),
    description: z.string().max(1000).optional(),
    active: z.boolean().optional(),
    metadata: z.record(z.string(), z.string()).optional(),
  }),
  {
    description: 'Update product information',
  },
)

export type UpdateProductRequest = z.infer<typeof UpdateProductRequest>

// ============= Create Price =============

/**
 * Create price request
 */
export const CreatePriceRequest = openapi(
  z.object({
    productId: z.string(),
    amount: Money,
    currency: Currency.default('usd'),
    interval: PriceInterval.optional(),
    intervalCount: z.number().int().positive().optional(),
  }),
  {
    description: 'Create a new price for a product',
  },
)

export type CreatePriceRequest = z.infer<typeof CreatePriceRequest>

// ============= List Products =============

/**
 * List products query parameters
 */
export const ListProductsQuery = openapi(
  z.object({
    active: z.coerce.boolean().optional(),
    type: ProductType.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
  {
    description: 'Query parameters for listing products',
  },
)

export type ListProductsQuery = z.infer<typeof ListProductsQuery>

/**
 * Products list response
 */
export const ProductListResponse = paginatedResponse(Product)

export type ProductListResponse = z.infer<typeof ProductListResponse>

// ============= List Prices =============

/**
 * List prices query parameters
 */
export const ListPricesQuery = openapi(
  z.object({
    productId: z.string().optional(),
    active: z.coerce.boolean().optional(),
    currency: Currency.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
  {
    description: 'Query parameters for listing prices',
  },
)

export type ListPricesQuery = z.infer<typeof ListPricesQuery>

/**
 * Prices list response
 */
export const PriceListResponse = paginatedResponse(Price)

export type PriceListResponse = z.infer<typeof PriceListResponse>

// ============= Path Parameters =============

/**
 * Product ID parameter
 */
export const ProductIdParam = openapi(
  z.object({
    id: z.string(),
  }),
  {
    description: 'Product ID path parameter',
  },
)

export type ProductIdParam = z.infer<typeof ProductIdParam>

/**
 * Price ID parameter
 */
export const PriceIdParam = openapi(
  z.object({
    id: z.string(),
  }),
  {
    description: 'Price ID path parameter',
  },
)

export type PriceIdParam = z.infer<typeof PriceIdParam>
