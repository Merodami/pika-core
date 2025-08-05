// User service exports - all tiers (using namespace exports to avoid conflicts)
import * as adminSchemas from './admin/index.js'
import * as internalSchemas from './internal/index.js'
import * as publicSchemas from './public/index.js'

export const adminUser = adminSchemas
export const publicUser = publicSchemas
export const internalUser = internalSchemas

// Export common schemas directly
export * from './common/index.js'
