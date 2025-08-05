/**
 * Admin API schemas export
 * Aggregates all admin schemas from all services
 */

export * from './schemas/auth/admin/index.js'
export * from './schemas/business/admin/index.js'
export * from './schemas/category/admin/index.js'
// export * from './schemas/communication/admin/index.js' // TODO: Uncomment when admin routes are implemented
export * from './schemas/discovery/admin/index.js'
export * from './schemas/payment/admin/index.js'
export * from './schemas/pdf/admin/index.js'
export * from './schemas/storage/admin/index.js'
export * from './schemas/subscription/admin/index.js'
export * from './schemas/support/admin/index.js'
export * from './schemas/system/admin/index.js'
export * from './schemas/user/admin/index.js'
export * from './schemas/voucher/admin/index.js'
// Note: Shared schemas are already included in service exports to avoid conflicts
