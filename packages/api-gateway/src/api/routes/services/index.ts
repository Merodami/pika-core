import { adminRoutes } from './admin.js'
import { internalRoutes } from './internal.js'
import { publicRoutes } from './public.js'

// Combine all routes in the order they should be processed
// More specific routes should come before general routes
export const allRoutes = [...adminRoutes, ...internalRoutes, ...publicRoutes]

// Export individual route arrays for flexibility
export { adminRoutes, internalRoutes, publicRoutes }
