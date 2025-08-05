import { logger } from '@pika/shared'

import { startCategoryService } from './app.js'

// Export server creation function for deployment package
export { createCategoryServer } from './server.js'

// Only start the service if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startCategoryService().catch((error) => {
    logger.error('Failed to start category service', error)
    process.exit(1)
  })
}
