import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { withTimestamps } from '../../shared/metadata.js'
import { DateTime, UUID } from '../../shared/primitives.js'

/**
 * Service discovery schemas for internal API
 * Handles service registration, discovery, and health monitoring
 */

// ============= Enums =============

export const ServiceStatus = z.enum([
  'STARTING',
  'HEALTHY',
  'DEGRADED',
  'UNHEALTHY',
  'STOPPED',
])
export type ServiceStatus = z.infer<typeof ServiceStatus>

export const ServiceType = z.enum([
  'API_GATEWAY',
  'MICROSERVICE',
  'DATABASE',
  'CACHE',
  'QUEUE',
  'STORAGE',
  'MONITORING',
])
export type ServiceType = z.infer<typeof ServiceType>

export const EnvironmentType = z.enum([
  'DEVELOPMENT',
  'STAGING',
  'PRODUCTION',
  'TEST',
])
export type EnvironmentType = z.infer<typeof EnvironmentType>

// ============= Service Instance =============

/**
 * Service endpoint information
 */
export const ServiceEndpoint = z.object({
  protocol: z.enum(['http', 'https', 'tcp', 'grpc']),
  host: z.string(),
  port: z.number().int().positive(),
  path: z.string().optional(),
  healthCheckPath: z.string().optional().default('/health'),
})

export type ServiceEndpoint = z.infer<typeof ServiceEndpoint>

/**
 * Service instance details
 */
export const ServiceInstance = openapi(
  withTimestamps({
    id: UUID,
    serviceName: z.string().min(1).max(100),
    serviceType: ServiceType,
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    instanceId: z.string().min(1),

    // Network information
    endpoints: z.array(ServiceEndpoint).min(1),

    // Environment
    environment: EnvironmentType,
    region: z.string().optional(),
    availabilityZone: z.string().optional(),

    // Status
    status: ServiceStatus,
    lastHealthCheck: DateTime.optional(),
    healthCheckUrl: z.string().url().optional(),

    // Metadata
    metadata: z.record(z.string(), z.string()).optional(),
    tags: z.array(z.string()).default([]),

    // Performance metrics
    metrics: z
      .object({
        cpuUsage: z.number().min(0).max(100).optional(),
        memoryUsage: z.number().min(0).max(100).optional(),
        diskUsage: z.number().min(0).max(100).optional(),
        requestCount: z.number().int().nonnegative().optional(),
        errorRate: z.number().min(0).max(100).optional(),
        responseTime: z.number().nonnegative().optional(),
      })
      .optional(),

    // Registration info
    registeredBy: z.string().optional(),
    lastSeen: DateTime,
    ttl: z.number().int().positive().default(60), // TTL in seconds
  }),
  {
    description: 'Service instance in the registry',
  },
)

export type ServiceInstance = z.infer<typeof ServiceInstance>

// ============= Service Registration =============

/**
 * Register service request
 */
export const RegisterServiceRequest = openapi(
  z.object({
    serviceName: z.string().min(1).max(100),
    serviceType: ServiceType,
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    instanceId: z.string().min(1),

    // Network information
    endpoints: z.array(ServiceEndpoint).min(1),

    // Environment
    environment: EnvironmentType,
    region: z.string().optional(),
    availabilityZone: z.string().optional(),

    // Health check
    healthCheckUrl: z.string().url().optional(),
    healthCheckInterval: z.number().int().positive().default(30),

    // Metadata
    metadata: z.record(z.string(), z.string()).optional(),
    tags: z.array(z.string()).default([]),

    // Registration settings
    ttl: z.number().int().positive().default(60),
    autoDeregister: z.boolean().default(true),
  }),
  {
    description: 'Register a service instance',
  },
)

export type RegisterServiceRequest = z.infer<typeof RegisterServiceRequest>

/**
 * Register service response
 */
export const RegisterServiceResponse = openapi(
  z.object({
    instanceId: UUID,
    serviceName: z.string(),
    registeredAt: DateTime,
    expiresAt: DateTime,
    healthCheckUrl: z.string().url().optional(),
  }),
  {
    description: 'Service registration confirmation',
  },
)

export type RegisterServiceResponse = z.infer<typeof RegisterServiceResponse>

// ============= Service Discovery =============

/**
 * Service registry query parameters
 */
export const ServiceRegistryQuery = z.object({
  serviceName: z.string().optional(),
  serviceType: ServiceType.optional(),
  environment: EnvironmentType.optional(),
  status: ServiceStatus.optional(),
  region: z.string().optional(),
  tags: z.array(z.string()).optional(),
  healthyOnly: z.boolean().default(true),
  includeMetrics: z.boolean().default(false),
})

export type ServiceRegistryQuery = z.infer<typeof ServiceRegistryQuery>

/**
 * Service registry response
 */
export const ServiceRegistryResponse = openapi(
  z.object({
    services: z.array(ServiceInstance),
    totalCount: z.number().int().nonnegative(),
    lastUpdated: DateTime,
  }),
  {
    description: 'List of registered services',
  },
)

export type ServiceRegistryResponse = z.infer<typeof ServiceRegistryResponse>

/**
 * Service endpoints response
 */
export const ServiceEndpointsResponse = openapi(
  z.object({
    serviceName: z.string(),
    instances: z.array(
      z.object({
        instanceId: z.string(),
        endpoints: z.array(ServiceEndpoint),
        status: ServiceStatus,
        lastSeen: DateTime,
        loadBalanceWeight: z.number().min(0).max(100).default(50),
      }),
    ),
    loadBalancingStrategy: z
      .enum(['ROUND_ROBIN', 'LEAST_CONNECTIONS', 'WEIGHTED'])
      .default('ROUND_ROBIN'),
  }),
  {
    description: 'Available endpoints for a service',
  },
)

export type ServiceEndpointsResponse = z.infer<typeof ServiceEndpointsResponse>

// ============= Service Health =============

/**
 * Service health check request
 */
export const ServiceHealthCheckRequest = z.object({
  instanceId: UUID,
  status: ServiceStatus,
  metrics: z
    .object({
      cpuUsage: z.number().min(0).max(100).optional(),
      memoryUsage: z.number().min(0).max(100).optional(),
      diskUsage: z.number().min(0).max(100).optional(),
      requestCount: z.number().int().nonnegative().optional(),
      errorRate: z.number().min(0).max(100).optional(),
      responseTime: z.number().nonnegative().optional(),
    })
    .optional(),
  customChecks: z
    .array(
      z.object({
        name: z.string(),
        status: z.enum(['PASS', 'FAIL', 'WARN']),
        message: z.string().optional(),
        duration: z.number().nonnegative().optional(),
      }),
    )
    .optional(),
})

export type ServiceHealthCheckRequest = z.infer<
  typeof ServiceHealthCheckRequest
>

/**
 * Service health status response
 */
export const ServiceHealthStatusResponse = openapi(
  z.object({
    serviceName: z.string(),
    instanceId: UUID,
    status: ServiceStatus,
    lastHealthCheck: DateTime,
    nextHealthCheck: DateTime,
    healthHistory: z
      .array(
        z.object({
          timestamp: DateTime,
          status: ServiceStatus,
          responseTime: z.number().nonnegative().optional(),
        }),
      )
      .optional(),
  }),
  {
    description: 'Service health status',
  },
)

export type ServiceHealthStatusResponse = z.infer<
  typeof ServiceHealthStatusResponse
>

// ============= Service Deregistration =============

/**
 * Deregister service request
 */
export const DeregisterServiceRequest = openapi(
  z.object({
    reason: z
      .enum(['SHUTDOWN', 'MAINTENANCE', 'ERROR', 'SCALE_DOWN'])
      .optional(),
    gracefulShutdown: z.boolean().default(true),
    drainConnections: z.boolean().default(true),
    drainTimeoutSeconds: z.number().int().positive().default(30),
  }),
  {
    description: 'Deregister service instance',
  },
)

export type DeregisterServiceRequest = z.infer<typeof DeregisterServiceRequest>

/**
 * Deregister service response
 */
export const DeregisterServiceResponse = openapi(
  z.object({
    instanceId: UUID,
    serviceName: z.string(),
    deregisteredAt: DateTime,
    gracefulShutdown: z.boolean(),
    message: z.string().optional(),
  }),
  {
    description: 'Service deregistration confirmation',
  },
)

export type DeregisterServiceResponse = z.infer<
  typeof DeregisterServiceResponse
>

// ============= Service Configuration =============

/**
 * Service configuration request
 */
export const ServiceConfigRequest = z.object({
  environment: EnvironmentType.optional(),
  configKeys: z.array(z.string()).optional(),
})

export type ServiceConfigRequest = z.infer<typeof ServiceConfigRequest>

/**
 * Service configuration response
 */
export const ServiceConfigResponse = openapi(
  z.object({
    serviceName: z.string(),
    environment: EnvironmentType,
    configuration: z.record(z.string(), z.any()),
    lastUpdated: DateTime,
    version: z.string(),
  }),
  {
    description: 'Service configuration data',
  },
)

export type ServiceConfigResponse = z.infer<typeof ServiceConfigResponse>

// ============= Service Dependencies =============

/**
 * Service dependency mapping
 */
export const ServiceDependency = z.object({
  serviceName: z.string(),
  dependsOn: z.array(z.string()),
  optional: z.boolean().default(false),
  healthCheckRequired: z.boolean().default(true),
  circuitBreakerEnabled: z.boolean().default(true),
})

export type ServiceDependency = z.infer<typeof ServiceDependency>

/**
 * Service dependency graph response
 */
export const ServiceDependencyGraphResponse = openapi(
  z.object({
    dependencies: z.array(ServiceDependency),
    healthySolutions: z.array(z.string()),
    unhealthyServices: z.array(z.string()),
    criticalPath: z.array(z.string()),
  }),
  {
    description: 'Service dependency graph and health analysis',
  },
)

export type ServiceDependencyGraphResponse = z.infer<
  typeof ServiceDependencyGraphResponse
>

// ============= Circuit Breaker =============

/**
 * Circuit breaker status
 */
export const CircuitBreakerStatus = z.object({
  serviceName: z.string(),
  targetService: z.string(),
  state: z.enum(['CLOSED', 'OPEN', 'HALF_OPEN']),
  failureCount: z.number().int().nonnegative(),
  failureThreshold: z.number().int().positive(),
  lastFailure: DateTime.optional(),
  nextRetryAt: DateTime.optional(),
  successCount: z.number().int().nonnegative(),
})

export type CircuitBreakerStatus = z.infer<typeof CircuitBreakerStatus>
