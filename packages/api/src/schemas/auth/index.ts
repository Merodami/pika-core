// Auth service exports - all tiers (using namespace exports to avoid conflicts)
import * as adminSchemas from './admin/index.js'
import * as frontendSchemas from './frontend/index.js'
import * as internalSchemas from './internal/index.js'
import * as publicSchemas from './public/index.js'

export const adminAuth = adminSchemas
export const publicAuth = publicSchemas
export const internalAuth = internalSchemas
export const frontendAuth = frontendSchemas

// Export common/shared schemas directly
export * from './common/enums.js'
export * from './common/patterns.js'
