import {} from // Import service URLs as needed
'@pika/environment'

import type { ServiceConfig } from '../types.js'

// Internal service-to-service routes
// These are typically not exposed through the API Gateway
// but if needed, they can be added here with proper authentication
export const internalRoutes: ServiceConfig[] = [
  // Example:
  // {
  //   name: 'internal/users',
  //   prefix: '/api/v1/internal/users',
  //   upstream: USER_API_URL,
  // },
]
