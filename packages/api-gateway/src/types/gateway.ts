import { OpenAPIV3 } from 'openapi-types'

/**
 * Configuration interface for the API Gateway
 *
 * @interface ApiGatewayConfig
 * @property {Object} rateLimit - Rate limiting configuration
 * @property {number} rateLimit.windowMs - Time window in milliseconds for rate limiting
 * @property {number} rateLimit.max - Maximum number of requests allowed in the time window
 * @property {Object} security - Security-related configuration
 * @property {boolean} security.enableHelmet - Whether to enable Helmet security headers
 * @property {boolean} security.enableCors - Whether to enable CORS
 * @property {boolean} security.enableCompression - Whether to enable response compression
 * @property {Object} healthCheck - Health check configuration
 * @property {string} healthCheck.path - Path for health check endpoints
 * @property {number} healthCheck.interval - Interval in milliseconds for health checks
 */
export interface ApiGatewayConfig {
  rateLimit: {
    windowMs: number
    max: number
  }
  security: {
    enableHelmet: boolean
    enableCors: boolean
    enableCompression: boolean
  }
  healthCheck: {
    path: string
    interval: number
  }
}

export type Document = OpenAPIV3.Document<OperationExtensions> & {
  // Extend the info object with logo https://redocly.com/docs/api-reference-docs/specification-extensions/x-logo/#logo-object
  info: OpenAPIV3.InfoObject & {
    'x-logo'?: {
      url: string
      altText: string
      backgroundColor?: string
      href?: string
    }
  }
}
export type OperationObject = OpenAPIV3.OperationObject<OperationExtensions>
export type PathItemObject = OpenAPIV3.PathItemObject<OperationExtensions> & {
  'x-amazon-apigateway-any-method'?: OperationObject
}

export interface OperationExtensions {
  'x-pika': BuildMeta
  /**
   * Flag added by scripts that generate other metadata from
   * `x-pikato mark that this step has happened.
   */
  'x-pikarocessed': true
  'x-amazon-apigateway-integration'?: {
    requestParameters?: Record<string, string>
  } & { [key: string]: unknown }
  'x-amazon-apigateway-request-validator'?: 'all' | 'params-only'
}

export interface Context {
  // TODO: Better name, and doc
  pikaaders: 'strip' | 'dangerous-passthrough' | 'dangerous-from-authorizer'
  defaultAuthorizerName: string
  orderAuthorizerName: string

  vpceId: string
  region: string
  restApiId: string
  stageName: string
  templateName: string
  loadBalancerDns: string
  vpcLinkId: string
  accountId: string
  deploymentKey: string
}

export interface BuildMeta {
  target: TargetService | TargetLambda | TargetS3 | TargetHTTP
  permissions?: string[]
  customMapping?: Record<string, string>
  cacheTtlSeconds?: number
  throttle?: {
    rateLimit: number
    burstLimit: number
  }
  doNotOverrideSecurity?: boolean
}

export type ServiceId =
  | 'order'
  | 'report'
  | 'product'
  | 'inventory'
  | 'communication'
  | 'ticket'
  | 'data-feed'

export type HttpMethod =
  | 'POST'
  | 'GET'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'OPTIONS'
  | 'HEAD'
  | 'X-AMAZON-APIGATEWAY-ANY-METHOD'

interface TargetService {
  type: 'service'
  id: ServiceId
  path: string
  method: HttpMethod
}

interface TargetLambda {
  type: 'lambda'
  id: string
}

interface TargetS3 {
  type: 's3'
  bucket: string
  path: string
}

interface TargetHTTP {
  type: 'http'
  httpMethod: HttpMethod
  uri: string
}
