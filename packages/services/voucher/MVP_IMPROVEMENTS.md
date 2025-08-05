# MVP Improvements & Best Practices

## Overview

This document outlines practical improvements to make the voucher platform MVP more robust, measurable, and extensible without over-engineering.

## 1. Critical Metrics for MVP Success

### Business Metrics

```typescript
interface MVPMetrics {
  // Revenue metrics
  monthlyRecurringRevenue: {
    adSales: number
    subscriptions: number
    total: number
  }

  // Engagement metrics
  activeUsers: {
    daily: number (DAU)
    monthly: number (MAU)
    retention: number // % returning users
  }

  // Conversion funnel
  funnel: {
    bookDistributed: number
    voucherScanned: number   // Awareness
    voucherClaimed: number   // Interest
    voucherRedeemed: number  // Conversion
    repeatRedemption: number // Loyalty
  }

  // Business performance
  businessMetrics: {
    activeBusinesses: number
    averageROI: number
    churnRate: number
    netPromoterScore: number
  }
}
```

### Implementation: Simple Metrics Service

```typescript
// packages/services/metrics/src/MetricsCollector.ts
export class MetricsCollector {
  constructor(
    private readonly redis: Redis,
    private readonly timeSeriesDB?: TimeSeries,
  ) {}

  // Use Redis for real-time counters
  async increment(metric: string, tags?: Record<string, string>): Promise<void> {
    const key = this.buildKey(metric, tags)
    await this.redis.incr(key)

    // Async write to time series for historical data
    if (this.timeSeriesDB) {
      this.timeSeriesDB.write(metric, 1, tags).catch(console.error)
    }
  }

  // Batch writes for performance
  async recordBatch(events: MetricEvent[]): Promise<void> {
    const pipeline = this.redis.pipeline()
    events.forEach((event) => {
      pipeline.incr(this.buildKey(event.metric, event.tags))
    })
    await pipeline.exec()
  }
}
```

## 2. Idempotency & Reliability Patterns

### Problem: Duplicate Scans/Redemptions

Users might double-click, network might retry, etc.

### Solution: Idempotency Keys

```typescript
// In RedemptionController
async redeemVoucher(request: FastifyRequest) {
  const idempotencyKey = request.headers['x-idempotency-key'] as string;

  if (idempotencyKey) {
    // Check if we've seen this request before
    const cached = await this.cache.get(`idemp:${idempotencyKey}`);
    if (cached) {
      return JSON.parse(cached); // Return previous response
    }
  }

  // Process redemption
  const result = await this.handler.execute(request.body);

  // Cache result for 24 hours
  if (idempotencyKey) {
    await this.cache.set(
      `idemp:${idempotencyKey}`,
      JSON.stringify(result),
      86400
    );
  }

  return result;
}
```

## 3. Scan Pattern Fraud Detection (Simple MVP Version)

### Implementation: Rate Limiting + Pattern Detection

```typescript
export class FraudDetector {
  private readonly SCAN_THRESHOLD = 10 // Max scans per minute
  private readonly LOCATION_THRESHOLD = 1000 // meters

  async checkScanPattern(scan: VoucherScan): Promise<FraudRisk> {
    // 1. Rate limiting per device
    const recentScans = await this.getRecentScans(scan.deviceId, 60)
    if (recentScans.length > this.SCAN_THRESHOLD) {
      return { risk: 'HIGH', reason: 'Excessive scanning rate' }
    }

    // 2. Geographic impossibility
    if (scan.location && recentScans.length > 0) {
      const lastScan = recentScans[0]
      const distance = this.calculateDistance(scan.location, lastScan.location)
      const timeDiff = scan.timestamp - lastScan.timestamp
      const speed = distance / timeDiff // m/s

      if (speed > 50) {
        // Faster than highway speed
        return { risk: 'HIGH', reason: 'Geographic impossibility' }
      }
    }

    // 3. Known patterns
    const patterns = await this.checkKnownPatterns(scan)
    if (patterns.suspicious) {
      return { risk: 'MEDIUM', reason: patterns.reason }
    }

    return { risk: 'LOW', reason: null }
  }
}
```

## 4. Offline-First Architecture

### Problem: Paraguay has areas with poor connectivity

### Solution: Progressive Sync

```typescript
// Flutter app offline storage
class OfflineVoucherStorage {
  // Store voucher data locally
  Future<void> cacheVoucher(Voucher voucher) async {
    await _database.insert('vouchers', voucher.toJson());
    await _cacheQRImage(voucher.qrCode);
  }

  // Queue redemptions when offline
  Future<void> queueRedemption(Redemption redemption) async {
    await _database.insert('pending_redemptions', {
      ...redemption.toJson(),
      'status': 'PENDING',
      'attempts': 0
    });
  }

  // Sync when connection returns
  Future<void> syncPendingRedemptions() async {
    final pending = await _database.query(
      'pending_redemptions',
      where: 'status = ?',
      whereArgs: ['PENDING']
    );

    for (final redemption in pending) {
      try {
        await _api.submitRedemption(redemption);
        await _markSynced(redemption['id']);
      } catch (e) {
        await _incrementAttempts(redemption['id']);
      }
    }
  }
}
```

## 5. Event Sourcing Light (For Audit Trail)

### Implementation: Simple Event Log

```typescript
interface VoucherEvent {
  id: string
  voucherId: string
  eventType: 'CREATED' | 'PUBLISHED' | 'SCANNED' | 'REDEEMED' | 'EXPIRED'
  userId?: string
  businessId?: string
  metadata: Record<string, any>
  timestamp: Date
}

// Store all state changes
class VoucherEventStore {
  async recordEvent(event: VoucherEvent): Promise<void> {
    // 1. Store in events table
    await this.prisma.voucherEvent.create({ data: event })

    // 2. Publish to event stream (for real-time analytics)
    await this.eventBus.publish('voucher.events', event)

    // 3. Update materialized view (current state)
    await this.updateMaterializedView(event)
  }

  // Rebuild state from events if needed
  async rebuildVoucherState(voucherId: string): Promise<Voucher> {
    const events = await this.prisma.voucherEvent.findMany({
      where: { voucherId },
      orderBy: { timestamp: 'asc' },
    })

    return events.reduce((state, event) => this.applyEvent(state, event), {} as Voucher)
  }
}
```

## 6. A/B Testing Framework (Simple)

### Use Case: Test different discount amounts, ad designs, etc.

```typescript
interface ABTest {
  id: string
  name: string
  variants: Array<{
    id: string
    weight: number // 0-100 percentage
    config: any
  }>
  metrics: string[] // Which metrics to track
  status: 'DRAFT' | 'RUNNING' | 'COMPLETED'
}

class ABTestService {
  // Assign user to variant
  getVariant(testId: string, userId: string): string {
    const test = await this.getTest(testId)

    // Consistent assignment using hash
    const hash = this.hashUserId(userId)
    const bucket = hash % 100

    let sum = 0
    for (const variant of test.variants) {
      sum += variant.weight
      if (bucket < sum) {
        return variant.id
      }
    }

    return test.variants[0].id // Fallback
  }

  // Track conversion
  async trackConversion(testId: string, userId: string, metric: string) {
    const variant = this.getVariant(testId, userId)
    await this.metrics.increment(`ab_test.${testId}.${variant}.${metric}`)
  }
}
```

## 7. Business Continuity & Disaster Recovery

### Backup Strategy

```yaml
# docker-compose.backup.yml
services:
  postgres-backup:
    image: postgres:15
    command: |
      sh -c "
        while true; do
          PGPASSWORD=$$POSTGRES_PASSWORD pg_dump \
            -h postgres -U postgres pika \
            | gzip > /backups/pika_$$(date +%Y%m%d_%H%M%S).sql.gz
          
          # Keep only last 7 days
          find /backups -name '*.sql.gz' -mtime +7 -delete
          
          # Sleep 6 hours
          sleep 21600
        done
      "
    volumes:
      - ./backups:/backups
```

### Health Checks

```typescript
// Comprehensive health check endpoint
app.get('/health/detailed', async (request, reply) => {
  const checks = await Promise.allSettled([this.checkDatabase(), this.checkRedis(), this.checkElasticsearch(), this.checkExternalAPIs()])

  const status = checks.every((c) => c.status === 'fulfilled') ? 'healthy' : 'degraded'

  return {
    status,
    timestamp: new Date(),
    checks: {
      database: checks[0],
      cache: checks[1],
      search: checks[2],
      external: checks[3],
    },
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      activeRequests: this.getActiveRequests(),
    },
  }
})
```

## 8. Performance Optimizations for Scale

### Database Indexes (Critical for MVP)

```sql
-- Voucher scans (most frequent query)
CREATE INDEX idx_voucher_scan_composite
ON voucher_scan(voucher_id, created_at DESC)
WHERE scan_type = 'CUSTOMER';

-- Redemption validation (needs to be fast)
CREATE INDEX idx_redemption_lookup
ON redemption(voucher_id, customer_id)
WHERE status = 'COMPLETED';

-- Geographic queries
CREATE INDEX idx_business_location
ON business USING GIST(location);

-- Analytics queries
CREATE INDEX idx_scan_analytics
ON voucher_scan(created_at, scan_type)
INCLUDE (voucher_id, user_id);
```

### Caching Strategy

```typescript
class CacheStrategy {
  // Cache voucher details (change infrequently)
  async getVoucher(id: string): Promise<Voucher> {
    const cacheKey = `voucher:${id}`
    const cached = await this.redis.get(cacheKey)

    if (cached) {
      // Extend TTL on access (LRU-like behavior)
      await this.redis.expire(cacheKey, 3600)
      return JSON.parse(cached)
    }

    const voucher = await this.db.getVoucher(id)
    await this.redis.setex(cacheKey, 3600, JSON.stringify(voucher))
    return voucher
  }

  // Don't cache user-specific data (changes frequently)
  // Don't cache analytics (needs to be real-time)
}
```

## 9. Security Enhancements

### API Key Rotation

```typescript
class APIKeyManager {
  // Generate new keys with overlap period
  async rotateBusinessAPIKey(businessId: string): Promise<void> {
    const newKey = this.generateSecureKey()
    const oldKey = await this.getCurrentKey(businessId)

    // Store both keys with expiration
    await this.redis.setex(`api_key:${newKey}`, 86400 * 30, businessId)
    await this.redis.expire(`api_key:${oldKey}`, 86400 * 7) // 7 day overlap

    // Notify business
    await this.notifyKeyRotation(businessId, newKey)
  }
}
```

### Rate Limiting by Business Tier

```typescript
const rateLimits = {
  BASIC: { requests: 100, window: '1h' },
  PREMIUM: { requests: 1000, window: '1h' },
  ENTERPRISE: { requests: 10000, window: '1h' },
}

app.addHook('onRequest', async (request, reply) => {
  const businessId = request.headers['x-business-id']
  const tier = await this.getBusinessTier(businessId)
  const limit = rateLimits[tier]

  const key = `rate_limit:${businessId}`
  const current = await this.redis.incr(key)

  if (current === 1) {
    await this.redis.expire(key, 3600) // 1 hour
  }

  if (current > limit.requests) {
    reply.code(429).send({
      error: 'Rate limit exceeded',
      limit: limit.requests,
      window: limit.window,
      retry_after: await this.redis.ttl(key),
    })
  }
})
```

## 10. Testing Strategy for MVP

### Critical Test Scenarios

```typescript
describe('MVP Critical Paths', () => {
  test('Complete redemption flow', async () => {
    // 1. Business creates voucher
    const voucher = await createVoucher(businessAuth)

    // 2. Generate QR for print
    const qr = await generateQR(voucher.id)

    // 3. Customer scans
    const scan = await scanVoucher(qr, customerAuth)
    expect(scan.status).toBe(200)

    // 4. Business redeems
    const redemption = await redeemVoucher(voucher.id, businessAuth)
    expect(redemption.status).toBe(200)

    // 5. Verify idempotency
    const duplicate = await redeemVoucher(voucher.id, businessAuth)
    expect(duplicate.status).toBe(409) // Already redeemed
  })

  test('Offline redemption sync', async () => {
    // Test offline queue and sync behavior
  })

  test('Concurrent operations', async () => {
    // Test race conditions
  })
})
```

## Implementation Priority

### Phase 1: Core Reliability (Week 1-2)

1. Idempotency for all mutations
2. Basic fraud detection
3. Critical database indexes
4. Health checks

### Phase 2: Metrics & Monitoring (Week 3-4)

1. Business metrics collection
2. Simple A/B testing
3. Performance monitoring
4. Basic alerting

### Phase 3: Optimization (Week 5-6)

1. Caching layer
2. Offline sync
3. API rate limiting
4. Backup automation

## Monitoring Checklist

```yaml
# Alerts to set up
alerts:
  - name: high_error_rate
    condition: error_rate > 5%
    severity: critical

  - name: slow_redemption
    condition: p95_latency > 1s
    severity: warning

  - name: low_scan_to_redemption
    condition: conversion_rate < 10%
    severity: info

  - name: database_connection_pool
    condition: active_connections > 80%
    severity: warning
```

## Conclusion

These improvements provide a solid foundation for the MVP while avoiding over-engineering. Focus on:

1. **Reliability**: Idempotency, health checks, backups
2. **Metrics**: Track what matters for business decisions
3. **Performance**: Index properly, cache smartly
4. **Security**: Basic fraud detection, rate limiting
5. **Extensibility**: Event sourcing light, A/B testing framework

Remember: It's better to have a simple solution that works reliably than a complex one that fails mysteriously.
