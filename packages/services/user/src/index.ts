import { logger } from '@pika/shared'

import { startUserService } from './app.js'

// Export the unified service startup function
export { startUserService }

// Export server creation function for deployment package
export { createUserServer } from './server.js'

// Bootstrap the User service if this file is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  startUserService()
    .then(() => {
      logger.info('User Service started successfully')
    })
    .catch((error) => {
      logger.error('Failed to start User Service:', error)
      process.exit(1)
    })
}
