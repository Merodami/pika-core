// Category service exports - all tiers (using namespace exports to avoid conflicts)
import * as adminSchemas from './admin/index.js'
import * as internalSchemas from './internal/index.js'
import * as publicSchemas from './public/index.js'

export const adminCategory = adminSchemas
export const publicCategory = publicSchemas
export const internalCategory = internalSchemas

// Export common schemas directly
export * from './common/index.js'
