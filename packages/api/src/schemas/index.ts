/**
 * Main schemas export file
 * Aggregates all schemas from the service-based structure
 */

// ============= Service Exports by Tier =============

// Auth Service
export * as authAdmin from './auth/admin/index.js'
export * as authCommon from './auth/common/index.js'
export * as authFrontend from './auth/frontend/index.js'
export * as authInternal from './auth/internal/index.js'
export * as authPublic from './auth/public/index.js'

// Business Service
export * as businessAdmin from './business/admin/index.js'
export * as businessCommon from './business/common/index.js'
export * as businessInternal from './business/internal/index.js'
export * as businessPublic from './business/public/index.js'

// Category Service
export * as categoryAdmin from './category/admin/index.js'
export * as categoryCommon from './category/common/index.js'
export * as categoryInternal from './category/internal/index.js'
export * as categoryPublic from './category/public/index.js'

// Communication Service
export * as communicationAdmin from './communication/admin/index.js'
export * as communicationCommon from './communication/common/index.js'
export * as communicationInternal from './communication/internal/index.js'
export * as communicationPublic from './communication/public/index.js'

// Discovery Service
export * as discoveryAdmin from './discovery/admin/index.js'
export * as discoveryCommon from './discovery/common/index.js'
export * as discoveryInternal from './discovery/internal/index.js'
export * as discoveryPublic from './discovery/public/index.js'

// Payment Service
export * as paymentAdmin from './payment/admin/index.js'
export * as paymentCommon from './payment/common/index.js'
export * as paymentInternal from './payment/internal/index.js'
export * as paymentPublic from './payment/public/index.js'

// PDF Service
export * as pdfAdmin from './pdf/admin/index.js'
export * as pdfCommon from './pdf/common/index.js'
export * as pdfInternal from './pdf/internal/index.js'
export * as pdfPublic from './pdf/public/index.js'

// Storage Service
export * as storageAdmin from './storage/admin/index.js'
export * as storageCommon from './storage/common/index.js'
export * as storageInternal from './storage/internal/index.js'
export * as storagePublic from './storage/public/index.js'

// Subscription Service
export * as subscriptionAdmin from './subscription/admin/index.js'
export * as subscriptionCommon from './subscription/common/index.js'
export * as subscriptionInternal from './subscription/internal/index.js'
export * as subscriptionPublic from './subscription/public/index.js'

// Support Service
export * as supportAdmin from './support/admin/index.js'
export * as supportCommon from './support/common/index.js'
export * as supportInternal from './support/internal/index.js'
export * as supportPublic from './support/public/index.js'

// System Service
export * as systemAdmin from './system/admin/index.js'
export * as systemCommon from './system/common/index.js'
export * as systemInternal from './system/internal/index.js'
export * as systemPublic from './system/public/index.js'

// User Service
export * as userAdmin from './user/admin/index.js'
export * as userCommon from './user/common/index.js'
export * as userInternal from './user/internal/index.js'
export * as userPublic from './user/public/index.js'

// Voucher Service
export * as voucherAdmin from './voucher/admin/index.js'
export * as voucherCommon from './voucher/common/index.js'
export * as voucherInternal from './voucher/internal/index.js'
export * as voucherPublic from './voucher/public/index.js'

// ============= Shared Schemas =============
export * as shared from './shared/index.js'
