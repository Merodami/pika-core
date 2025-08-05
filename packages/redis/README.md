# 🔴 @pika/redis - High-Performance Caching Layer

![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?logo=typescript)
![Architecture](https://img.shields.io/badge/Architecture-Clean-green)
![Redis](https://img.shields.io/badge/Redis-7.x-red?logo=redis)
![Status](https://img.shields.io/badge/Status-Production-success)

## 🎯 Purpose & Vision

The Redis package is the **centralized caching backbone** for the Pika platform. It provides a high-performance, distributed caching layer with intelligent key management, method-level caching decorators, and enterprise-grade reliability. The package enables sub-millisecond data access while maintaining data consistency across all microservices.

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Build the package
yarn nx run @pika/redis:build

# Run tests
yarn nx run @pikat
```

## 📋 Overview

The Redis package provides a comprehensive caching layer for the Pika platform:

- **Cache Service**: Unified caching interface with Redis and memory fallback
- **Decorator Pattern**: Method-level caching with `@Cache()` decorator
- **Key Generation**: Smart cache key generation strategies
- **Multi-Provider**: Redis and in-memory cache implementations
- **Type Safety**: Full TypeScript support with generic types
- **Performance**: Optimized for high-throughput operations
- **Reliability**: Connection pooling, automatic failover, retry logic
- **Monitoring**: Built-in metrics and health checks

### Key Features

- ⚡ **Sub-millisecond Access**: Optimized Redis operations with connection pooling
- 🎯 **Smart Caching**: Method-level `@Cache()` decorator with intelligent key generation
- 🔄 **Multi-Provider**: Seamless switching between Redis and in-memory implementations
- 🛡️ **Enterprise Reliability**: Automatic retries, failover, and error handling
- 📊 **Advanced Patterns**: Tag-based invalidation, batch operations, atomic counters
- 🔧 **Highly Configurable**: Extensive configuration options for production environments
- 📈 **Performance Monitoring**: Built-in metrics for cache hit rates and response times
- 🧪 **Testing Friendly**: Memory cache implementation for development and testing

## 🏗️ Architecture

### Clean Architecture Layers

```
src/
├── application/           # Application layer
│   └── decorators/        # Cache decorators
│       └── cache.ts       # @Cache() method decorator
├── domain/                # Domain layer
│   ├── repositories/      # Repository interfaces
│   │   └── ICacheService.ts # Cache service contract
│   └── types/             # Domain types
│       └── cache.ts       # Cache-related types
├── infrastructure/        # Infrastructure layer
│   ├── cache/             # Cache implementations
│   │   └── keygen.ts      # Key generation utilities
│   ├── config/            # Configuration
│   │   └── redis.ts       # Redis connection config
│   └── services/          # Service implementations
│       ├── memory.ts      # In-memory cache service
│       └── redis.ts       # Redis cache service
├── config/                # Configuration exports
│   └── index.ts           # Config aggregation
└── index.ts               # Package exports
```

### Key Components

- **ICacheService**: Universal cache interface
- **RedisService**: Production Redis implementation
- **MemoryCacheService**: Development/testing fallback
- **CacheDecorator**: Method-level caching automation
- **KeyGenerator**: Intelligent cache key creation

## 🔌 Usage

### Basic Cache Operations

```typescript
import { RedisService, MemoryCacheService } from '@pika

// Initialize cache service
const cacheService = process.env.NODE_ENV === 'production' ? new RedisService() : new MemoryCacheService()

// Set cache value
await cacheService.set('user:123', userData, 3600) // 1 hour TTL

// Get cache value
const user = await cacheService.get<User>('user:123')

// Delete cache value
await cacheService.delete('user:123')

// Check if key exists
const exists = await cacheService.exists('user:123')
```

### Method-Level Caching with Decorator

```typescript
import { Cache } from '@pika

class UserService {
  @Cache({
    ttl: 3600, // 1 hour TTL
    prefix: 'users', // Key prefix
    keyGenerator: 'httpRequest', // Use HTTP request for key
  })
  async getUserById(id: string): Promise<User> {
    // This result will be cached automatically
    return await this.userRepository.findById(id)
  }

  @Cache({
    ttl: 1800, // 30 minutes TTL
    prefix: 'user-sessions',
    keyGenerator: (userId: string, sessionType: string) => `${userId}:${sessionType}`, // Custom key generation
  })
  async getUserSessions(userId: string, sessionType: string) {
    return await this.sessionRepository.findByUser(userId, sessionType)
  }
}
```

### Advanced Caching Patterns

```typescript
// Batch operations
await cacheService.setMany([
  { key: 'user:1', value: user1, ttl: 3600 },
  { key: 'user:2', value: user2, ttl: 3600 },
])

const users = await cacheService.getMany<User>(['user:1', 'user:2'])

// Pattern-based deletion
await cacheService.deletePattern('session:*')

// Atomic operations
await cacheService.increment('visit-count:page:home')
await cacheService.decrement('stock:item:123')
```

## 🔧 Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
REDIS_KEY_PREFIX=pika:

# Connection Settings
REDIS_CONNECT_TIMEOUT=10000
REDIS_COMMAND_TIMEOUT=5000
REDIS_RETRY_ATTEMPTS=3
REDIS_RETRY_DELAY=500

# Cache Defaults
DEFAULT_CACHE_TTL=3600
MAX_CACHE_KEY_LENGTH=250
CACHE_COMPRESSION_ENABLED=true
```

### Redis Connection Options

```typescript
import { createRedisConfig } from '@pika

const redisConfig = createRedisConfig({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB),
  keyPrefix: process.env.REDIS_KEY_PREFIX,
  retryDelayOnFailover: 500,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
})
```

## 🧪 Testing

```bash
# Run all tests
yarn nx run @pikat

# Run with coverage
yarn nx run @pikat --coverage

# Run specific test
yarn test cache.service.test.ts
```

### Test Examples

```typescript
import { MemoryCacheService } from '@pika

describe('CacheService', () => {
  let cacheService: MemoryCacheService

  beforeEach(() => {
    cacheService = new MemoryCacheService()
  })

  it('should store and retrieve values', async () => {
    await cacheService.set('test-key', 'test-value', 60)
    const value = await cacheService.get('test-key')
    expect(value).toBe('test-value')
  })

  it('should handle TTL expiration', async () => {
    await cacheService.set('expire-key', 'value', 1)
    await new Promise((resolve) => setTimeout(resolve, 1100))
    const value = await cacheService.get('expire-key')
    expect(value).toBeNull()
  })
})
```

## 📊 Cache Strategies

### Key Generation Strategies

```typescript
// HTTP Request-based keys
@Cache({ keyGenerator: 'httpRequest' })
// Generates: users:GET:/api/users/123?include=profile

// Parameter-based keys
@Cache({ keyGenerator: (id: string) => `user:${id}` })
// Generates: users:user:123

// Complex object keys
@Cache({
  keyGenerator: (filters: UserFilters) =>
    `search:${JSON.stringify(filters)}`
})
// Generates: users:search:{"role":"admin","active":true}
```

### Cache Invalidation Patterns

```typescript
// Tag-based invalidation
@Cache({
  tags: ['user', 'profile'],
  ttl: 3600
})
async getUserProfile(id: string) { ... }

// Invalidate by tags
await cacheService.invalidateTags(['user'])

// Time-based invalidation
@Cache({
  ttl: 300,  // 5 minutes
  refreshAhead: 60  // Refresh 1 minute before expiry
})
async getRealtimeData() { ... }
```

## 🔄 Integration with Services

### Service Registration

```typescript
// In service initialization
import { createExpressServer } from '@pika
import { RedisService } from '@pika

const app = await createExpressServer({
  serviceName: 'user-service',
  cacheService: new RedisService(), // Inject cache service
  // ... other options
})
```

### Cross-Service Caching

```typescript
// Session management across services
class SessionService {
  @Cache({ prefix: 'sessions', ttl: 1800 })
  async getActiveSession(userId: string) {
    return await this.sessionRepository.findActive(userId)
  }

  async invalidateUserSessions(userId: string) {
    await this.cacheService.deletePattern(`sessions:*:${userId}:*`)
  }
}
```

## 📈 Performance Considerations

### Best Practices

- **Small Values**: Keep cached values under 1MB
- **Reasonable TTLs**: Balance freshness vs performance
- **Key Patterns**: Use consistent naming conventions
- **Monitoring**: Track cache hit/miss ratios
- **Compression**: Enable for large objects

### Monitoring

```typescript
// Cache statistics
const stats = await cacheService.getStats()
console.log({
  hitRate: stats.hits / (stats.hits + stats.misses),
  totalKeys: stats.keyCount,
  memoryUsage: stats.memoryUsage,
})

// Health check integration
async function cacheHealthCheck() {
  try {
    await cacheService.set('health-check', Date.now(), 10)
    await cacheService.get('health-check')
    return { status: 'healthy' }
  } catch (error) {
    return { status: 'unhealthy', error: error.message }
  }
}
```

## 🚨 Error Handling

The Redis package includes robust error handling:

- **Connection Failures**: Automatic retry with exponential backoff
- **Timeout Handling**: Configurable command timeouts
- **Fallback Strategy**: Graceful degradation to memory cache
- **Error Logging**: Structured error reporting

## 🎯 Best Practices

### Cache Strategy

1. **Appropriate TTLs**: Balance data freshness with performance
2. **Key Patterns**: Use consistent, hierarchical naming conventions
3. **Small Payloads**: Keep cached values under 1MB for optimal performance
4. **Strategic Caching**: Cache expensive operations, not cheap ones
5. **Cache Invalidation**: Plan invalidation strategies upfront

### Performance Optimization

1. **Batch Operations**: Use `setMany`/`getMany` for multiple operations
2. **Connection Pooling**: Leverage Redis connection pooling
3. **Pipeline Operations**: Use Redis pipelining for multiple commands
4. **Monitor Hit Rates**: Track and optimize cache hit ratios
5. **Compression**: Enable compression for large objects

### Error Handling

1. **Graceful Degradation**: Design for cache failures
2. **Fallback Strategies**: Always have non-cached alternatives
3. **Monitoring**: Track cache health and performance
4. **Timeouts**: Set reasonable operation timeouts
5. **Retry Logic**: Implement exponential backoff for retries

## 📝 Dependencies

### Core Dependencies

- **ioredis**: Modern Redis client with clustering support
- **lru-cache**: In-memory LRU cache implementation
- **lodash-es**: Utility functions for data manipulation

### Internal Dependencies

- **@pika/shared**: Error handling and utilities
- **@pika/environment**: Configuration management
- **@pika/types**: Shared type definitions

## 📝 Changelog

### Recent Updates

- Implemented unified cache service interface
- Added method-level caching decorator
- Created intelligent key generation strategies
- Added batch operations and atomic counters
- Implemented tag-based cache invalidation
- Added comprehensive health checks and monitoring
- Created memory cache fallback for development
- Enhanced error handling and retry logic

---

**Package Version**: 1.0.0  
**Last Updated**: 2025-01-27  
**Maintainer**: Platform Team
