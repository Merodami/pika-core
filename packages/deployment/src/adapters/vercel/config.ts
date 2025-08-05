import { getServiceDefinitions } from '../../services/definitions.js'
import type { DeploymentConfig } from '../../types/index.js'

export function getVercelConfig(): DeploymentConfig {
  const environment = (process.env.VERCEL_ENV || 'development') as
    | 'development'
    | 'staging'
    | 'production'

  return {
    platform: 'vercel',
    environment,
    region: process.env.VERCEL_REGION || 'iad1',
    services: getServiceDefinitions(),
    infrastructure: {
      database: {
        url: process.env.DATABASE_URL || process.env.POSTGRES_URL || '',
        ssl: environment !== 'development',
        poolSize: 10, // Vercel recommends lower pool sizes
      },
      cache: {
        url: process.env.REDIS_URL || process.env.KV_URL || '',
        ttl: 3600,
        ssl: environment !== 'development',
      },
      storage: {
        type: (process.env.STORAGE_TYPE as 's3' | 'blob') || 's3',
        endpoint: process.env.STORAGE_ENDPOINT,
        bucket: process.env.STORAGE_BUCKET || 'pika-storage',
        region: process.env.STORAGE_REGION || 'us-east-1',
        accessKey: process.env.STORAGE_ACCESS_KEY,
        secretKey: process.env.STORAGE_SECRET_KEY,
      },
      email: {
        provider: 'resend',
        apiKey: process.env.RESEND_API_KEY,
        from: process.env.EMAIL_FROM || 'noreply@pika.com',
      },
    },
    gateway: {
      enabled: true,
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: environment === 'production' ? 100 : 1000,
      },
    },
    monitoring: {
      enabled: environment === 'production',
      provider: 'datadog',
    },
  }
}
