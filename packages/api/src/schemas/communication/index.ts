// Communication service exports - all tiers (using namespace exports to avoid conflicts)
import * as internalSchemas from './internal/index.js'
import * as publicSchemas from './public/index.js'

export const publicCommunication = publicSchemas
export const internalCommunication = internalSchemas

// Export common schemas directly
export * from './common/index.js'
