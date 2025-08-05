import { startService } from './app.js'

// Export server creation function for deployment package
export { createSupportServer } from './server.js'

// Only start the service if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startService().catch((error) => {
    console.error('Failed to start support service:', error)
    process.exit(1)
  })
}
