import 'dotenv/config'

import { logger } from '@pika/shared'

import { startService } from './app.js'

// Export server creation function for deployment package
export { createCommunicationServer } from './server.js'

// Only start the service if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startService().catch((error) => {
    logger.error('Failed to start communication service', error)
    process.exit(1)
  })
}
