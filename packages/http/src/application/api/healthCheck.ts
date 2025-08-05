import { HEALTH_CHECK_MEMORY_THRESHOLD } from '@pika/environment'
import {
  ApplicationError,
  buildHealthReport,
  createSystemHealthCheck,
  executeHealthChecks,
  getCriticalDependencies,
  HealthCheckDependency,
  logger,
} from '@pika/shared'
import { ErrorCode, getDefaultMessageForError } from '@pika/types'
import type { Express, RequestHandler } from 'express'

import { ServiceHealthCheckOptions } from '../../domain/types/healthCheck.js'

/**
 * Sets up health check endpoints for a service
 */
export function setupServiceHealthCheck(
  app: Express,
  dependencies: HealthCheckDependency[],
  options: ServiceHealthCheckOptions,
): void {
  const {
    serviceName,
    version = '1.0.0',
    basePath = '/api/v1',
    customChecks = [],
  } = options

  const healthPath = `${basePath}/health`
  const startTime = Date.now()

  // Add system check to dependencies
  const allDependencies = [
    ...dependencies,
    {
      name: 'system',
      check: createSystemHealthCheck(HEALTH_CHECK_MEMORY_THRESHOLD),
      details: { type: 'System', essential: false },
    },
    ...customChecks,
  ]

  // Main health check endpoint
  const mainHandler: RequestHandler = async (_req, res, next) => {
    try {
      if (!dependencies || dependencies.length === 0) {
        throw new ApplicationError(
          getDefaultMessageForError(
            ErrorCode.HEALTH_CHECK_DEPENDENCIES_MISSING,
          ),
          {
            code: ErrorCode.HEALTH_CHECK_DEPENDENCIES_MISSING,
            httpStatus: 500,
            source: 'health_check',
            metadata: {
              path: healthPath,
            },
          },
        )
      }

      // Execute all health checks
      const serviceResults = await executeHealthChecks(
        allDependencies,
        startTime,
      )

      // Build the health report
      const healthReport = buildHealthReport(serviceResults, startTime, version)

      // Return appropriate status code based on health
      const statusCode = healthReport.status === 'unhealthy' ? 503 : 200

      res.status(statusCode).json(healthReport)
    } catch (error) {
      next(error)
    }
  }

  // Liveness probe
  const livenessHandler: RequestHandler = (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      service: serviceName,
      timestamp: new Date().toISOString(),
    })
  }

  // Readiness probe
  const readinessHandler: RequestHandler = async (_req, res, next) => {
    try {
      if (!dependencies || dependencies.length === 0) {
        throw new ApplicationError(
          getDefaultMessageForError(
            ErrorCode.HEALTH_CHECK_DEPENDENCIES_MISSING,
          ),
          {
            code: ErrorCode.HEALTH_CHECK_DEPENDENCIES_MISSING,
            httpStatus: 500,
            source: 'health_check',
            metadata: {
              path: healthPath,
            },
          },
        )
      }

      // Get critical dependencies
      const criticalDeps = getCriticalDependencies(dependencies)

      // Execute health checks for critical dependencies
      const serviceResults = await executeHealthChecks(criticalDeps, startTime)

      // Determine overall status
      const overallStatus = serviceResults.some(
        (svc: any) => svc.status === 'unhealthy',
      )
        ? 'unhealthy'
        : 'healthy'

      // Return appropriate status code
      const statusCode = overallStatus === 'unhealthy' ? 503 : 200

      res.status(statusCode).json({
        status: overallStatus,
        service: serviceName,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      next(error)
    }
  }

  app.get(healthPath, mainHandler)
  app.get(`${healthPath}/liveness`, livenessHandler)
  app.get(`${healthPath}/readiness`, readinessHandler)

  logger.info(`Health check endpoints configured at ${healthPath}`)
}
