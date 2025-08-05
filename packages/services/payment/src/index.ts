import 'dotenv/config'

import { logger } from '@pika/shared'

import { startService } from './app.js'

// Export server creation function for deployment package
export { createPaymentServer } from './server.js'

// Only start the service if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startService().catch((error) => {
    logger.error('Failed to start payment service', error)
    process.exit(1)
  })
}
