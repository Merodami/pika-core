import type { ProviderConfig } from '@communication/services/providers/ProviderFactory.js'
import { LOCALSTACK_ENDPOINT } from '@pika/environment'

export function getEnvironmentConfig(): ProviderConfig {
  const environment = (process.env.NODE_ENV || 'development') as
    | 'development'
    | 'staging'
    | 'production'
    | 'test'

  // Check if we're running on Vercel
  const isVercel = process.env.VERCEL === '1'

  // Check if we're running in CI/GitHub Actions
  const isCI = process.env.CI === 'true'

  // Check for LocalStack
  const localstackEndpoint = LOCALSTACK_ENDPOINT
  const useLocalstack = process.env.USE_LOCALSTACK === 'true'

  const config: ProviderConfig = {
    environment,
    email: {
      aws: {
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      resend: {
        apiKey: process.env.RESEND_API_KEY,
      },
    },
    sms: {
      aws: {
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        defaultSenderId: process.env.SMS_SENDER_ID || 'Pika',
      },
    },
  }

  // Environment-specific overrides
  switch (environment) {
    case 'development':
      config.email = {
        ...config.email,
        primary: 'console',
        fallback: 'console',
      }
      config.sms = {
        ...config.sms,
        primary: 'console',
      }

      // If LocalStack is enabled in development
      if (useLocalstack) {
        config.email.aws = {
          ...config.email.aws,
          endpoint: localstackEndpoint,
        }
        config.sms.aws = {
          ...config.sms.aws,
          endpoint: localstackEndpoint,
        }
        config.email.primary = 'aws-ses'
        config.sms.primary = 'aws-sns'
      }
      break

    case 'test':
      // Always use console in tests unless explicitly testing providers
      config.email = {
        primary: 'console',
        fallback: 'console',
      }
      config.sms = {
        primary: 'console',
      }

      // CI environments might use LocalStack
      if (isCI && useLocalstack) {
        config.email.aws = {
          ...config.email.aws,
          endpoint: localstackEndpoint,
        }
        config.sms.aws = {
          ...config.sms.aws,
          endpoint: localstackEndpoint,
        }
      }
      break

    case 'staging':
      if (isVercel) {
        // Vercel staging prefers Resend
        config.email = {
          ...config.email,
          primary: 'resend',
          fallback: 'aws-ses',
        }
      } else {
        // AWS staging
        config.email = {
          ...config.email,
          primary: 'aws-ses',
          fallback: 'resend',
        }
      }
      config.sms = {
        ...config.sms,
        primary: 'aws-sns',
      }
      break

    case 'production':
      // Production always uses AWS as primary
      config.email = {
        ...config.email,
        primary: 'aws-ses',
        fallback: 'resend', // Resend as fallback
      }
      config.sms = {
        ...config.sms,
        primary: 'aws-sns',
      }
      break
  }

  return config
}

export function getLocalStackConfig() {
  return {
    endpoint: LOCALSTACK_ENDPOINT,
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  }
}

export function isLocalDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' && !process.env.USE_LOCALSTACK
}

export function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.CI === 'true'
}

export function isVercelDeployment(): boolean {
  return process.env.VERCEL === '1'
}
