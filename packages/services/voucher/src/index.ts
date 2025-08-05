import { logger } from '@pika/shared'

import { startVoucherService } from './app.js'

// Export the unified service startup function
export { startVoucherService }

// Export server creation function for deployment package
export { createVoucherServer } from './server.js'

// Bootstrap the Voucher service if this file is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  startVoucherService()
    .then(() => {
      logger.info('Voucher Service started successfully')
    })
    .catch((error) => {
      logger.error('Failed to start Voucher Service:', error)
      process.exit(1)
    })
}
