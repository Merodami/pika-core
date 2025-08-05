import { logger } from '@pika/shared'

import { startPDFService } from './app.js'

// Export the unified service startup function
export { startPDFService }

// Export server creation function for deployment package
export { createPDFServer } from './server.js'

// Bootstrap the PDF Generator service if this file is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  startPDFService()
    .then(() => {
      logger.info('PDF Generator Service started successfully')
    })
    .catch((error) => {
      logger.error('Failed to start PDF Generator Service:', error)
      process.exit(1)
    })
}
