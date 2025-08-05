# 🌍 @pika/environment - Type-Safe Configuration Management

![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?logo=typescript)
![dotenv](https://img.shields.io/badge/dotenv-17.2.1-yellow)
![Status](https://img.shields.io/badge/Status-Production-success)
![Zero Dependencies](https://img.shields.io/badge/Core_Dependencies-3-green)

## 🎯 Purpose & Vision

The Environment package serves as the **centralized configuration hub** for the entire Pika platform. It provides type-safe access to all environment variables, standardized parsers, intelligent defaults, and automatic validation. This ensures consistent configuration management across all microservices while preventing runtime configuration errors.

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Build the package
yarn nx run @pika/environment:build

# Run tests
yarn nx run @pika/environment:test

# Validate configuration
yarn nx run @pika/environment:validate
```

## 📋 Overview

The Environment package is an enterprise-grade configuration management system that:

- **Provides Type Safety**: Full TypeScript support for all configuration values
- **Validates at Runtime**: Ensures required variables exist with proper types
- **Supports Multiple Environments**: Development, staging, production configs
- **Offers Smart Defaults**: Sensible development defaults for rapid setup
- **Enables Feature Flags**: Environment-based feature toggles
- **Centralizes Service Config**: All service ports, URLs, and settings
- **Parses Complex Types**: Automatic parsing of numbers, booleans, arrays
- **Handles Cloud Config**: Support for cloud provider URL formats (Redis, etc.)

### Key Features

- 🔐 **Security First**: JWT, API keys, and secrets management
- 🌐 **Service Discovery**: All microservice URLs and ports
- 📊 **Infrastructure Config**: Database, Redis, AWS, Stripe settings
- 🚀 **Zero Config Development**: Works out-of-box with defaults
- 🔄 **Hot Reload Support**: Automatic .env file detection
- 📝 **Comprehensive Types**: Every variable is properly typed
- 🛡️ **Validation Layer**: Fail fast on missing critical config
- 🌍 **i18n Support**: Default language and supported locales

## 🏗️ Architecture

### Package Structure

```
src/
├── constants/             # Organized configuration modules
│   ├── apiGateway.ts     # API Gateway settings
│   ├── apiUrls.ts        # Service URL configuration
│   ├── appInfo.ts        # Application metadata
│   ├── auth.ts           # Authentication (JWT, API keys)
│   ├── aws.ts            # AWS services configuration
│   ├── communication.ts  # Email/SMS providers
│   ├── currency.ts       # Currency settings
│   ├── database.ts       # PostgreSQL configuration
│   ├── email.ts          # Email service settings
│   ├── features.ts       # Feature flags
│   ├── geolocation.ts    # Location services
│   ├── healthCheck.ts    # Health check intervals
│   ├── monitoring.ts     # Telemetry configuration
│   ├── node.ts           # Node.js runtime settings
│   ├── pagination.ts     # Default pagination values
│   ├── rateLimiting.ts   # Rate limit configuration
│   ├── redis.ts          # Redis cache settings
│   ├── seed.ts           # Database seeding config
│   ├── service.ts        # All service ports/hosts
│   ├── stripe.ts         # Payment processing
│   ├── testIds.ts        # Test data identifiers
│   └── index.ts          # Module exports
├── getEnvVariable.ts      # Core environment getter
├── loadEnv.ts            # .env file loader
├── parsers.ts            # Type parsing utilities
├── version.ts            # Version information
└── index.ts              # Package exports
```

### Configuration Flow

```mermaid
graph LR
    A[.env Files] --> B[loadEnv]
    B --> C[getEnvVariable]
    C --> D[Type Parsers]
    D --> E[Validated Config]
    E --> F[Service Import]

    G[process.env] --> C
    H[Default Values] --> C
```

## 🔧 Core Utilities

### Environment Variable Getter

```typescript
// Core function with type safety
export function getEnvVariable<T>(key: string, parser: (value: string) => T = String as any, defaultValue?: T): T {
  const value = process.env[key]

  if (value === undefined) {
    if (defaultValue !== undefined) return defaultValue
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return parser(value)
}
```

### Type Parsers

```typescript
// Built-in parsers for common types
export const parseString = (value: string): string => value
export const parseNumber = (value: string): number => {
  const num = Number(value)
  if (isNaN(num)) throw new Error(`Invalid number: ${value}`)
  return num
}
export const parseBoolean = (value: string): boolean => value.toLowerCase() === 'true'
export const parseArray = (value: string): string[] => value.split(',').map((s) => s.trim())
```

## 📊 Configuration Categories

### 🔐 Authentication Configuration

```typescript
// JWT Configuration with RS256 support
export const JWT_SECRET = getEnvVariable('JWT_SECRET', String, 'dev-secret')
export const JWT_ALGORITHM = getEnvVariable('JWT_ALGORITHM', parseString, 'RS256')
export const JWT_PRIVATE_KEY = getEnvVariable('JWT_PRIVATE_KEY', (value) => value.replace(/\\n/g, '\n'), '')
export const JWT_PUBLIC_KEY = getEnvVariable('JWT_PUBLIC_KEY', (value) => value.replace(/\\n/g, '\n'), '')

// Token Expiry
export const JWT_ACCESS_EXPIRY = getEnvVariable('JWT_ACCESS_EXPIRY', parseString, '15m')
export const JWT_REFRESH_EXPIRY = getEnvVariable('JWT_REFRESH_EXPIRY', parseString, '7d')

// Service-to-Service Auth
export const SERVICE_API_KEY = getEnvVariable('SERVICE_API_KEY', parseString, 'default-service-api-key')
export const INTERNAL_API_TOKEN = getEnvVariable('INTERNAL_API_TOKEN', String, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
```

### 🗄️ Database Configuration

```typescript
export const DATABASE_URL = getEnvVariable('DATABASE_URL', parseString)
export const DATABASE_POOL_MIN = getEnvVariable('DATABASE_POOL_MIN', parseNumber, 2)
export const DATABASE_POOL_MAX = getEnvVariable('DATABASE_POOL_MAX', parseNumber, 10)
export const DATABASE_IDLE_TIMEOUT = getEnvVariable('DATABASE_IDLE_TIMEOUT', parseNumber, 10000)
export const DATABASE_CONNECT_TIMEOUT = getEnvVariable('DATABASE_CONNECT_TIMEOUT', parseNumber, 5000)
export const DATABASE_LOGGING = getEnvVariable('DATABASE_LOGGING', parseBoolean, false)
```

### 🚀 Redis Configuration

```typescript
// Smart Redis URL parsing for cloud providers
if (process.env.REDIS_URL && !process.env.REDIS_HOST) {
  const url = new URL(process.env.REDIS_URL)
  process.env.REDIS_HOST = url.hostname
  process.env.REDIS_PORT = url.port || '6379'
  if (url.password) process.env.REDIS_PASSWORD = url.password
}

export const REDIS_HOST = getEnvVariable('REDIS_HOST', parseString, 'localhost')
export const REDIS_PORT = getEnvVariable('REDIS_PORT', parseNumber, 6380)
export const REDIS_PASSWORD = getEnvVariable('REDIS_PASSWORD', parseString, '')
export const REDIS_PREFIX = getEnvVariable('REDIS_PREFIX', String, 'pika:')
export const REDIS_DEFAULT_TTL = getEnvVariable('REDIS_DEFAULT_TTL', Number, 3600)
```

### 🌐 Service Configuration

```typescript
// Service ports and hosts
export const USER_SERVICE_PORT = getEnvVariable('USER_SERVICE_PORT', parseNumber, 5501)
export const AUTH_SERVICE_PORT = getEnvVariable('AUTH_SERVICE_PORT', parseNumber, 5502)
export const PAYMENT_SERVICE_PORT = getEnvVariable('PAYMENT_SERVICE_PORT', parseNumber, 5505)
export const BUSINESS_SERVICE_PORT = getEnvVariable('BUSINESS_SERVICE_PORT', parseNumber, 5511)
export const CATEGORY_SERVICE_PORT = getEnvVariable('CATEGORY_SERVICE_PORT', parseNumber, 5512)
export const VOUCHER_SERVICE_PORT = getEnvVariable('VOUCHER_SERVICE_PORT', parseNumber, 5514)

// Service URLs (computed from host/port)
export const SERVICE_URLS = {
  USER: `http://${USER_SERVICE_HOST}:${USER_SERVICE_PORT}`,
  AUTH: `http://${AUTH_SERVICE_HOST}:${AUTH_SERVICE_PORT}`,
  PAYMENT: `http://${PAYMENT_SERVICE_HOST}:${PAYMENT_SERVICE_PORT}`,
  // ... etc
}

// i18n Configuration
export const DEFAULT_LANGUAGE = getEnvVariable('DEFAULT_LANGUAGE', String, 'es')
export const SUPPORTED_LANGUAGES = ['es', 'en', 'gn'] as const
```

### 💳 Payment Configuration (Stripe)

```typescript
export const STRIPE_SECRET_KEY = getEnvVariable('STRIPE_SECRET_KEY', parseString, '')
export const STRIPE_WEBHOOK_SECRET = getEnvVariable('STRIPE_WEBHOOK_SECRET', parseString, '')
export const STRIPE_API_VERSION = getEnvVariable('STRIPE_API_VERSION', parseString, '2025-01-27')
export const STRIPE_WEBHOOK_TOLERANCE = getEnvVariable('STRIPE_WEBHOOK_TOLERANCE', parseNumber, 300)
```

### 🚩 Feature Flags

```typescript
export const FEATURE_FLAGS = {
  VOUCHER_SYSTEM_ENABLED: getEnvVariable('FEATURE_VOUCHER_SYSTEM', parseBoolean, true),
  PAYMENT_PROCESSING_ENABLED: getEnvVariable('FEATURE_PAYMENTS', parseBoolean, true),
  MULTI_LANGUAGE_ENABLED: getEnvVariable('FEATURE_MULTI_LANG', parseBoolean, true),
  GEOLOCATION_ENABLED: getEnvVariable('FEATURE_GEOLOCATION', parseBoolean, false),
  ANALYTICS_ENABLED: getEnvVariable('FEATURE_ANALYTICS', parseBoolean, true),
  PDF_GENERATION_ENABLED: getEnvVariable('FEATURE_PDF', parseBoolean, true),
}
```

## 🔌 Usage Examples

### Basic Import and Usage

```typescript
import { DATABASE_URL, REDIS_HOST, REDIS_PORT, JWT_SECRET, SERVICE_URLS, FEATURE_FLAGS, DEFAULT_LANGUAGE } from '@pika/environment'

// Direct usage
const prisma = new PrismaClient({ datasourceUrl: DATABASE_URL })
const redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT })

// Feature flag checking
if (FEATURE_FLAGS.VOUCHER_SYSTEM_ENABLED) {
  app.use('/vouchers', voucherRoutes)
}

// Service communication
const userServiceClient = new UserServiceClient(SERVICE_URLS.USER)
```

### Custom Environment Variables

```typescript
import { getEnvVariable, parseNumber, parseArray } from '@pika/environment'

// Custom parsing
const customTimeout = getEnvVariable('CUSTOM_TIMEOUT', parseNumber, 5000)
const allowedOrigins = getEnvVariable('ALLOWED_ORIGINS', parseArray, ['http://localhost:3000'])

// Complex parsing
const complexConfig = getEnvVariable(
  'COMPLEX_CONFIG',
  (value) => {
    return JSON.parse(value)
  },
  { default: 'config' },
)
```

### Environment Validation

```typescript
// Validate all required variables on startup
import { validateEnvironment } from '@pika/environment'

const validation = validateEnvironment()
if (!validation.isValid) {
  console.error('❌ Missing environment variables:', validation.missing)
  console.error('❌ Invalid environment variables:', validation.invalid)
  process.exit(1)
}
```

## 🧪 Testing

### Unit Tests

```typescript
describe('Environment Configuration', () => {
  it('should parse numbers correctly', () => {
    process.env.TEST_NUMBER = '42'
    const value = getEnvVariable('TEST_NUMBER', parseNumber)
    expect(value).toBe(42)
  })

  it('should use defaults when variable missing', () => {
    delete process.env.TEST_MISSING
    const value = getEnvVariable('TEST_MISSING', String, 'default')
    expect(value).toBe('default')
  })

  it('should throw on missing required variable', () => {
    delete process.env.TEST_REQUIRED
    expect(() => getEnvVariable('TEST_REQUIRED')).toThrow()
  })
})
```

### Environment File Examples

#### Development (.env.local)

```bash
# Core
NODE_ENV=development
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5435/pika
DATABASE_LOGGING=true

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380

# Auth
JWT_SECRET=dev-secret-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Services
USER_SERVICE_PORT=5501
AUTH_SERVICE_PORT=5502
BUSINESS_SERVICE_PORT=5511

# Features
FEATURE_VOUCHER_SYSTEM=true
FEATURE_PAYMENTS=false
```

#### Production (.env)

```bash
# Core
NODE_ENV=production
LOG_LEVEL=info

# Database (from cloud provider)
DATABASE_URL=${DATABASE_URL}
DATABASE_POOL_MAX=50

# Redis (from cloud provider)
REDIS_URL=${REDIS_URL}

# Auth (from secrets manager)
JWT_PRIVATE_KEY=${JWT_PRIVATE_KEY}
JWT_PUBLIC_KEY=${JWT_PUBLIC_KEY}
SERVICE_API_KEY=${SERVICE_API_KEY}

# Stripe
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
```

## 🔒 Security Best Practices

### Secret Management

1. **Never commit secrets**: Use `.env.local` for local development
2. **Use placeholders**: Production .env should reference external vars
3. **Rotate regularly**: Implement secret rotation for API keys
4. **Audit access**: Log access to sensitive configuration

### Configuration Hierarchy

```
1. Environment Variables (highest priority)
2. .env.local (development only)
3. .env (base configuration)
4. Default values in code (lowest priority)
```

## 🚨 Error Handling

### Missing Required Variables

```typescript
try {
  const config = await import('@pika/environment')
} catch (error) {
  if (error.message.includes('Missing required environment variable')) {
    console.error('❌ Configuration Error:', error.message)
    console.error('💡 Tip: Copy .env.example to .env.local and fill in values')
    process.exit(1)
  }
  throw error
}
```

### Invalid Variable Format

```typescript
// Parser errors provide context
try {
  const port = getEnvVariable('PORT', parseNumber)
} catch (error) {
  console.error(`❌ Invalid PORT value: ${process.env.PORT}`)
  console.error('💡 PORT must be a valid number')
}
```

## 📈 Performance Considerations

- **Singleton Pattern**: Configuration is loaded once and cached
- **Lazy Loading**: Environment files loaded on first import
- **Type Safety**: No runtime overhead after initial parsing
- **Tree Shaking**: Import only needed configuration modules

## 🤝 Contributing

### Adding New Configuration

1. **Create Module**: Add new file in `src/constants/`
2. **Define Variables**: Use `getEnvVariable` with proper types
3. **Export Constants**: Add to `constants/index.ts`
4. **Document Usage**: Update this README
5. **Add Tests**: Ensure parsers work correctly

### Best Practices

- Use descriptive variable names
- Always provide sensible defaults for development
- Use appropriate parsers for type safety
- Group related configuration together
- Document required vs optional variables

## 🔄 Migration Guide

From scattered process.env usage:

```typescript
// Before
const port = parseInt(process.env.PORT || '3000')
const redisHost = process.env.REDIS_HOST || 'localhost'

// After
import { SERVICE_PORT, REDIS_HOST } from '@pika/environment'
```

## 📝 Changelog

### Recent Updates

- Added RS256 JWT support with key pair configuration
- Implemented smart Redis URL parsing for cloud providers
- Enhanced service configuration with all microservice ports
- Added comprehensive type parsers
- Implemented feature flag system

---

**Package Version**: 1.0.0  
**Last Updated**: 2025-01-27  
**Maintainer**: Platform Team
