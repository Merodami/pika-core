import { createDeploymentAdapter } from '@pika/deployment'

// Don't load local env files on Vercel - environment variables are provided by Vercel
// Only import getLocalEnv if not in production
if (
  process.env.NODE_ENV !== 'production' &&
  process.env.DEPLOYMENT_PLATFORM !== 'vercel'
) {
  const { getLocalEnv } = await import('@pika/environment')
  getLocalEnv()
}

// Create a singleton app instance
let app

export default async function handler(req, res) {
  try {
    // Initialize app on first request (cold start)
    if (!app) {
      const adapter = await createDeploymentAdapter('vercel')
      app = await adapter.createApp()
    }

    // Let Express handle the request
    app(req, res)
  } catch (error) {
    console.error('Handler error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    })
  }
}
