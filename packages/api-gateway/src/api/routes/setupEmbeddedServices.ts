import { logger } from '@pika/shared'
import type { Application, NextFunction, Request, Response } from 'express'

/**
 * Service route mapping for embedded mode
 * Maps API paths to service mount points
 */
const SERVICE_ROUTES = [
  { prefix: '/api/v1/auth', service: 'auth', mount: '/auth' },
  { prefix: '/api/v1/users', service: 'user', mount: '/users' },
  { prefix: '/api/v1/admin/users', service: 'user', mount: '/admin/users' },
  {
    prefix: '/api/v1/internal/users',
    service: 'user',
    mount: '/internal/users',
  },
  { prefix: '/api/v1/gyms', service: 'gym', mount: '/gyms' },
  { prefix: '/api/v1/admin/gyms', service: 'gym', mount: '/admin/gyms' },
  { prefix: '/api/v1/stuff', service: 'gym', mount: '/stuff' },
  { prefix: '/api/v1/admin/stuff', service: 'gym', mount: '/admin/stuff' },
  { prefix: '/api/v1/inductions', service: 'gym', mount: '/inductions' },
  { prefix: '/api/v1/favorites', service: 'gym', mount: '/favorites' },
  { prefix: '/api/v1/sessions', service: 'session', mount: '/sessions' },
  {
    prefix: '/api/v1/admin/sessions',
    service: 'session',
    mount: '/admin/sessions',
  },
  { prefix: '/api/v1/reviews', service: 'session', mount: '/reviews' },
  {
    prefix: '/api/v1/waiting-list',
    service: 'session',
    mount: '/waiting-list',
  },
  { prefix: '/api/v1/credits', service: 'payment', mount: '/credits' },
  {
    prefix: '/api/v1/credit-packs',
    service: 'payment',
    mount: '/credit-packs',
  },
  { prefix: '/api/v1/promo-codes', service: 'payment', mount: '/promo-codes' },
  { prefix: '/api/v1/memberships', service: 'payment', mount: '/memberships' },
  {
    prefix: '/api/v1/payments/webhooks',
    service: 'payment',
    mount: '/webhooks',
  },
  { prefix: '/api/v1/products', service: 'payment', mount: '/' },
  { prefix: '/api/v1/plans', service: 'subscription', mount: '/plans' },
  {
    prefix: '/api/v1/subscriptions',
    service: 'subscription',
    mount: '/subscriptions',
  },
  {
    prefix: '/api/v1/internal/subscriptions',
    service: 'subscription',
    mount: '/internal/subscriptions',
  },
  {
    prefix: '/api/v1/communications',
    service: 'communication',
    mount: '/communications',
  },
  {
    prefix: '/api/v1/internal/communications',
    service: 'communication',
    mount: '/internal/communications',
  },
  { prefix: '/api/v1/social', service: 'social', mount: '/social' },
  { prefix: '/api/v1/support', service: 'support', mount: '/support' },
  { prefix: '/api/v1/storage', service: 'storage', mount: '/storage' },
]

/**
 * Sets up embedded services by mounting Express apps directly
 * This avoids the network overhead of proxying in monolith deployments
 */
export async function setupEmbeddedServices(
  app: Application,
  services: Map<string, Application>,
): Promise<void> {
  logger.info('Setting up embedded services')

  // Create a middleware that adds service context headers
  const addServiceContext = (serviceName: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
      // Add internal API key for service auth
      req.headers['x-api-key'] =
        process.env.SERVICE_API_KEY || 'default-service-api-key'

      // Add service identification
      req.headers['x-service-name'] = serviceName
      req.headers['x-gateway-mode'] = 'embedded'

      // Log the request
      logger.debug(
        {
          service: serviceName,
          method: req.method,
          path: req.path,
          originalUrl: req.originalUrl,
        },
        'Routing to embedded service',
      )

      next()
    }
  }

  // Mount each service at its API path
  for (const route of SERVICE_ROUTES) {
    const serviceApp = services.get(route.service)

    if (serviceApp) {
      // Create a sub-router for path rewriting
      app.use(
        route.prefix,
        (req: Request, res: Response, next: NextFunction) => {
          // Add service context
          addServiceContext(route.service)(req, res, () => {
            // Rewrite the URL to match service expectations
            // Services expect their base path (e.g., /auth, /users) in the URL
            const newPath = route.mount + req.path

            req.url = newPath

            // Mount the service app
            serviceApp(req, res, next)
          })
        },
      )

      logger.info(
        `Mounted embedded service: ${route.service} at ${route.prefix}`,
      )
    } else {
      logger.warn(`Service not found for embedded mounting: ${route.service}`)
    }
  }

  // Add a catch-all handler for unmatched API routes
  app.use('/api/v1/*splat', (req: Request, res: Response) => {
    logger.warn(
      {
        path: req.path,
        method: req.method,
      },
      'No service found for API route',
    )

    res.status(404).json({
      error: {
        code: 'SERVICE_NOT_FOUND',
        message: 'The requested service endpoint does not exist',
      },
    })
  })

  logger.info('Embedded services setup complete', {
    totalServices: services.size,
    mountedServices: SERVICE_ROUTES.filter((r) => services.has(r.service))
      .length,
  })
}
