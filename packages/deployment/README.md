# 🚀 @pika/deployment - Multi-Platform Deployment Adapters

![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?logo=typescript)
![Platforms](https://img.shields.io/badge/Platforms-Vercel_|_AWS_|_Docker-green)
![Architecture](https://img.shields.io/badge/Architecture-Adaptive-purple)
![Status](https://img.shields.io/badge/Status-Production-success)

## 🎯 Purpose & Vision

The Deployment package is the **platform abstraction layer** that enables the Pika platform to run seamlessly across different deployment environments. It provides intelligent adapters that automatically configure services for optimal performance whether deploying to Vercel's serverless platform, AWS infrastructure, or traditional Docker containers. This ensures deployment flexibility without code changes.

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Build the package
yarn nx run @pika/deployment:build

# Deploy to Vercel
yarn deploy:vercel

# Deploy to AWS
yarn deploy:aws

# Run with Docker
yarn deploy:docker
```

## 📋 Overview

The Deployment package is a sophisticated deployment orchestration system that:

- **Abstracts Platform Differences**: Single codebase, multiple platforms
- **Optimizes for Each Platform**: Serverless for Vercel, containers for AWS
- **Manages Service Discovery**: Automatic service URL configuration
- **Handles Infrastructure**: Database, cache, and storage setup
- **Provides Health Checks**: Platform-specific health monitoring
- **Enables Zero-Config Deploy**: Environment-based auto-configuration
- **Supports Multiple Modes**: Monolith, microservices, or hybrid
- **Manages Secrets**: Platform-specific secret management

### Key Features

- 🎯 **Platform Adapters**: Vercel, AWS, Docker, Kubernetes
- 🔄 **Automatic Configuration**: Environment-based setup
- 🏗️ **Service Registry**: Dynamic service discovery
- 🌐 **API Gateway Integration**: Seamless gateway setup
- 📊 **Health Monitoring**: Platform-specific health checks
- 🔒 **Secret Management**: Secure configuration handling
- ⚡ **Performance Optimization**: Platform-specific tuning
- 🛡️ **Error Recovery**: Graceful degradation

## 🏗️ Architecture

### Package Structure

```
src/
├── adapters/                    # Platform-specific adapters
│   ├── base.ts                 # Abstract base adapter
│   ├── vercel/                 # Vercel serverless adapter
│   │   ├── adapter.ts          # Vercel implementation
│   │   ├── config.ts           # Vercel configuration
│   │   └── index.ts            # Vercel exports
│   ├── aws/                    # AWS deployment adapter
│   │   ├── adapter.ts          # AWS ECS/Lambda
│   │   ├── config.ts           # AWS configuration
│   │   └── index.ts            # AWS exports
│   ├── docker/                 # Docker container adapter
│   │   ├── adapter.ts          # Docker implementation
│   │   └── config.ts           # Docker configuration
│   └── index.ts               # Adapter exports
├── services/                   # Service management
│   ├── definitions.ts          # Service definitions
│   ├── clients.ts             # Service client factory
│   └── registry.ts            # Service registry
├── types/                      # TypeScript types
│   ├── adapter.ts             # Adapter interfaces
│   ├── config.ts              # Configuration types
│   └── index.ts               # Type exports
├── utils/                      # Utilities
│   ├── environment.ts         # Environment detection
│   └── health.ts              # Health check utilities
├── factory.ts                  # Adapter factory
└── index.ts                   # Package exports
```

### Deployment Flow

```mermaid
graph TD
    A[Application Start] --> B{Detect Platform}
    B -->|Vercel| C[Vercel Adapter]
    B -->|AWS| D[AWS Adapter]
    B -->|Docker| E[Docker Adapter]

    C --> F[Serverless Config]
    D --> G[Container Config]
    E --> H[Local Config]

    F --> I[API Gateway Embedded]
    G --> J[Service Mesh]
    H --> K[Docker Compose]

    I --> L[Deploy]
    J --> L
    K --> L
```

## 🔌 Platform Adapters

### Vercel Adapter (Serverless)

```typescript
import { createDeploymentAdapter } from '@pika/deployment'

// Automatic platform detection
const adapter = await createDeploymentAdapter()

// Or explicit Vercel adapter
const vercelAdapter = await createDeploymentAdapter({
  platform: 'vercel',
  config: {
    region: 'iad1',
    environment: 'production',
    infrastructure: {
      database: {
        url: process.env.DATABASE_URL,
        pooling: true,
      },
      cache: {
        url: process.env.REDIS_URL,
        ttl: 3600,
      },
    },
  },
})

// Create application
const app = await vercelAdapter.createApp()

// Export for Vercel
export default app
```

### AWS Adapter (ECS/Lambda)

```typescript
const awsAdapter = await createDeploymentAdapter({
  platform: 'aws',
  config: {
    region: 'us-east-1',
    deployment: {
      type: 'ecs', // or 'lambda'
      cluster: 'pika-cluster',
      service: 'pika-api',
    },
    infrastructure: {
      database: {
        endpoint: process.env.RDS_ENDPOINT,
        secretArn: process.env.DB_SECRET_ARN,
      },
      cache: {
        endpoint: process.env.ELASTICACHE_ENDPOINT,
        clusterMode: true,
      },
      storage: {
        bucket: process.env.S3_BUCKET,
        region: 'us-east-1',
      },
    },
  },
})

// Start server (ECS mode)
await awsAdapter.startServer(app)
```

### Docker Adapter (Local/K8s)

```typescript
const dockerAdapter = await createDeploymentAdapter({
  platform: 'docker',
  config: {
    mode: 'development',
    services: {
      discovery: 'docker-compose', // or 'kubernetes'
      network: 'pika-network',
    },
    infrastructure: {
      database: {
        host: 'postgres',
        port: 5432,
      },
      cache: {
        host: 'redis',
        port: 6379,
      },
    },
  },
})

// Start with hot reload
await dockerAdapter.startServer(app, {
  port: 3000,
  hotReload: true,
})
```

## 🌐 Service Configuration

### Service Registry

```typescript
export interface ServiceDefinition {
  name: string
  version: string
  createApp: (deps: ServiceDependencies) => Promise<Application>
  healthCheck?: () => Promise<HealthStatus>
  dependencies?: string[]
  config?: ServiceConfig
}

// Register services
const serviceRegistry = new ServiceRegistry()

serviceRegistry.register({
  name: 'user-service',
  version: '1.0.0',
  createApp: async (deps) => createUserService(deps),
  healthCheck: async () => checkUserServiceHealth(),
  dependencies: ['auth-service', 'database'],
  config: {
    port: 5001,
    basePath: '/users',
  },
})
```

### Service Discovery

```typescript
// Platform-specific service discovery
class ServiceDiscovery {
  // Vercel: Environment variables
  private getVercelServiceUrl(service: string): string {
    return process.env[`${service.toUpperCase()}_URL`] || `${process.env.VERCEL_URL}/api/${service}`
  }

  // AWS: Service discovery or ALB
  private async getAWSServiceUrl(service: string): Promise<string> {
    if (this.useServiceDiscovery) {
      return await this.serviceDiscovery.getEndpoint(service)
    }
    return `http://${service}.internal:80`
  }

  // Docker: Container names
  private getDockerServiceUrl(service: string): string {
    return `http://${service}:${this.getServicePort(service)}`
  }
}
```

## 🏭 Deployment Modes

### Monolith Mode (Vercel)

```typescript
// All services embedded in API Gateway
const app = await createGatewayWithServices({
  mode: 'embedded',
  services: ['auth-service', 'user-service', 'payment-service', 'voucher-service'],
  middleware: {
    rateLimit: true,
    authentication: true,
    cors: true,
  },
})

// Single deployment unit
export default app
```

### Microservices Mode (AWS/K8s)

```typescript
// Each service deployed separately
const services = await deployServices({
  mode: 'distributed',
  orchestrator: 'kubernetes',
  config: {
    namespace: 'pika-prod',
    replicas: {
      'user-service': 3,
      'payment-service': 2,
      'voucher-service': 2,
    },
    resources: {
      cpu: '500m',
      memory: '512Mi',
    },
  },
})

// API Gateway as ingress
const gateway = await deployGateway({
  services: services.map((s) => s.endpoint),
  loadBalancing: 'round-robin',
})
```

### Hybrid Mode

```typescript
// Core services embedded, others distributed
const hybridAdapter = await createDeploymentAdapter({
  platform: 'aws',
  mode: 'hybrid',
  embedded: ['auth-service', 'user-service'],
  distributed: ['payment-service', 'pdf-service'],
})
```

## 📊 Health Monitoring

### Platform-Specific Health Checks

```typescript
interface HealthCheck {
  checkDatabase(): Promise<HealthStatus>
  checkCache(): Promise<HealthStatus>
  checkServices(): Promise<ServiceHealthMap>
  checkInfrastructure(): Promise<InfrastructureHealth>
}

// Vercel health endpoint
app.get('/api/health', async (req, res) => {
  const health = await adapter.getHealth()
  res.status(health.isHealthy ? 200 : 503).json(health)
})

// AWS ECS health check
const ecsHealthCheck = {
  path: '/health',
  interval: 30,
  timeout: 5,
  retries: 3,
  startPeriod: 60,
}

// Kubernetes probes
const k8sProbes = {
  livenessProbe: {
    httpGet: { path: '/health/live', port: 3000 },
    initialDelaySeconds: 30,
    periodSeconds: 10,
  },
  readinessProbe: {
    httpGet: { path: '/health/ready', port: 3000 },
    initialDelaySeconds: 5,
    periodSeconds: 5,
  },
}
```

## 🔧 Configuration

### Environment Variables

```bash
# Platform detection
DEPLOYMENT_PLATFORM=vercel|aws|docker|auto

# Vercel configuration
VERCEL_ENV=production
VERCEL_URL=https://pika.vercel.app
VERCEL_REGION=iad1

# AWS configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
ECS_CLUSTER=pika-cluster
ECS_SERVICE=pika-api

# Infrastructure URLs
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
S3_BUCKET=pika-storage

# Service discovery
SERVICE_DISCOVERY_ENABLED=true
SERVICE_MESH_ENABLED=false

# Feature flags
ENABLE_HOT_RELOAD=false
ENABLE_DISTRIBUTED_TRACING=true
ENABLE_METRICS=true
```

### Platform-Specific Config

```typescript
// config/platforms.ts
export const platformConfigs = {
  vercel: {
    maxDuration: 10, // seconds
    regions: ['iad1'],
    environment: ['preview', 'production'],
    buildCommand: 'yarn build',
    outputDirectory: 'dist',
  },
  aws: {
    ecsTaskDefinition: './deploy/ecs-task.json',
    dockerFile: './deploy/Dockerfile',
    loadBalancer: {
      type: 'application',
      healthCheck: '/health',
      targetPort: 3000,
    },
  },
  docker: {
    composeFile: './docker-compose.yml',
    networks: ['pika-network'],
    volumes: ['pika-data'],
  },
}
```

## 🧪 Testing

### Adapter Testing

```typescript
describe('DeploymentAdapters', () => {
  describe('VercelAdapter', () => {
    it('should create embedded gateway', async () => {
      const adapter = new VercelDeploymentAdapter({
        platform: 'vercel',
        environment: 'test',
      })

      const app = await adapter.createApp()

      // Test embedded services
      const response = await request(app).get('/api/v1/users/health').expect(200)

      expect(response.body.status).toBe('healthy')
    })
  })

  describe('Platform Detection', () => {
    it('should auto-detect Vercel', () => {
      process.env.VERCEL = '1'
      const platform = detectPlatform()
      expect(platform).toBe('vercel')
    })
  })
})
```

## 🚀 Deployment Commands

### Vercel Deployment

```bash
# Deploy to production
vercel --prod

# Deploy preview
vercel

# Environment setup
vercel env pull
vercel env add DATABASE_URL
vercel env add CACHE_DISABLED  # Set to "true" to avoid Redis connection limits

# Redeploy after environment changes
vercel --prod --force
```

#### Vercel-Specific Configuration

1. **vercel.json** - Deployment configuration:

```json
{
  "buildCommand": "yarn build:vercel",
  "outputDirectory": ".",
  "installCommand": "yarn install --immutable",
  "framework": null,
  "functions": {
    "api/index.js": {
      "maxDuration": 30,
      "memory": 1024
    }
  },
  "rewrites": [
    { "source": "/health", "destination": "/api" },
    { "source": "/api/v1/:path*", "destination": "/api" },
    { "source": "/auth/:path*", "destination": "/api" },
    { "source": "/users/:path*", "destination": "/api" },
    { "source": "/businesses/:path*", "destination": "/api" },
    { "source": "/categories/:path*", "destination": "/api" },
    { "source": "/payments/:path*", "destination": "/api" },
    { "source": "/subscriptions/:path*", "destination": "/api" },
    { "source": "/communications/:path*", "destination": "/api" },
    { "source": "/support/:path*", "destination": "/api" },
    { "source": "/storage/:path*", "destination": "/api" },
    { "source": "/pdf/:path*", "destination": "/api" },
    { "source": "/vouchers/:path*", "destination": "/api" }
  ]
}
```

2. **Critical Environment Variables**:

```bash
# Required for Vercel deployment
DEPLOYMENT_PLATFORM=vercel
CACHE_DISABLED=true              # Prevents Redis connection overload
NODE_ENV=production

# Database (use pooler connection)
DATABASE_URL=postgres://user:pass@host:6543/db?sslmode=require&pgbouncer=true
MIGRATION_DATABASE_URL=postgres://user:pass@host:5432/db  # Direct connection for migrations

# Service URLs
API_GATEWAY_BASE_URL=https://your-app.vercel.app
BASE_URL=https://your-app.vercel.app

# Authentication
JWT_SECRET=<generated-secret>
JWT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n<key>\n-----END PRIVATE KEY-----
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n<key>\n-----END PUBLIC KEY-----
```

3. **Common Issues & Solutions**:

- **Redis Connection Errors**: Set `CACHE_DISABLED=true`
- **Build Failures**: Ensure `yarn install --immutable` works locally
- **Cold Starts**: First request may take 5-10 seconds
- **Database Timeouts**: Use pooler connection string, not direct

### AWS Deployment

```bash
# Build Docker image
docker build -t pika-api .

# Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URI
docker tag pika-api:latest $ECR_URI/pika-api:latest
docker push $ECR_URI/pika-api:latest

# Deploy to ECS
aws ecs update-service --cluster pika-cluster --service pika-api --force-new-deployment
```

### Docker Deployment

```bash
# Local development
docker-compose up -d

# Production with Swarm
docker stack deploy -c docker-compose.prod.yml pika

# Kubernetes
kubectl apply -f k8s/
```

## 📈 Performance Optimization

### Platform-Specific Optimizations

```typescript
// Vercel: Edge functions
export const config = {
  runtime: 'edge',
  regions: ['iad1', 'sfo1']
}

// AWS: Container insights
const ecsOptimizations = {
  enableExecuteCommand: true,
  enableContainerInsights: true,
  capacityProviders: ['FARGATE_SPOT'],
  placementStrategies: [{
    type: 'spread',
    field: 'attribute:ecs.availability-zone'
  }]
}

// Docker: Multi-stage builds
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
COPY --from=builder /app/node_modules ./node_modules
```

## 🔒 Security Considerations

### Secret Management

```typescript
// Vercel: Environment variables
const secrets = {
  database: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  stripeKey: process.env.STRIPE_SECRET_KEY,
}

// AWS: Secrets Manager
const secrets = await getSecrets(['rds-password', 'jwt-secret', 'stripe-key'])

// Docker: Secret files
const secrets = {
  database: fs.readFileSync('/run/secrets/db_password'),
  jwt: fs.readFileSync('/run/secrets/jwt_key'),
}
```

## 🎯 Best Practices

1. **Environment Parity**: Keep dev/staging/prod similar
2. **Immutable Deployments**: Never modify running containers
3. **Health Checks**: Implement comprehensive health monitoring
4. **Graceful Shutdown**: Handle SIGTERM properly
5. **Resource Limits**: Set CPU/memory limits
6. **Monitoring**: Use platform-native monitoring
7. **Logging**: Centralized, structured logging
8. **Secrets**: Never commit secrets to code

## 📊 Monitoring & Observability

```typescript
// Metrics collection
const metrics = {
  vercel: {
    // Vercel Analytics
    webVitals: true,
    customEvents: ['api_request', 'payment_processed'],
  },
  aws: {
    // CloudWatch Metrics
    namespace: 'Pika/API',
    dimensions: [{ Name: 'ServiceName', Value: 'api-gateway' }],
  },
  datadog: {
    // Custom metrics
    apiKey: process.env.DD_API_KEY,
    tags: ['env:prod', 'service:api'],
  },
}
```

## 📝 Changelog

### Recent Updates

- Added Vercel serverless adapter with embedded services
- Implemented AWS ECS/Fargate adapter
- Created Docker adapter for local development
- Added automatic platform detection
- Implemented service registry pattern
- Added comprehensive health monitoring

---

**Package Version**: 1.0.0  
**Last Updated**: 2025-01-27  
**Maintainer**: DevOps Team
