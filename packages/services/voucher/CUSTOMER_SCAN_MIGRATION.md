# Customer Scan Feature Migration Guide

## Overview

This guide outlines the database migrations and implementation steps needed to support customer voucher scanning and claiming functionality.

## Database Migrations Required

### 1. Add Scan Tracking Columns to Voucher Table

```sql
-- Add scan and claim counters to voucher table
ALTER TABLE "Voucher"
ADD COLUMN IF NOT EXISTS "scanCount" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "claimCount" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "impressions" INTEGER DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "idx_voucher_scan_count" ON "Voucher"("scanCount");
CREATE INDEX IF NOT EXISTS "idx_voucher_claim_count" ON "Voucher"("claimCount");
```

### 2. Create VoucherScan Table

```sql
-- Track all voucher scans for analytics
CREATE TABLE IF NOT EXISTS "VoucherScan" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "voucherId" UUID NOT NULL REFERENCES "Voucher"("id") ON DELETE CASCADE,
  "userId" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "scanType" VARCHAR(20) NOT NULL CHECK ("scanType" IN ('CUSTOMER', 'BUSINESS')),
  "scanSource" VARCHAR(20) NOT NULL CHECK ("scanSource" IN ('CAMERA', 'GALLERY', 'LINK', 'SHARE')),
  "deviceInfo" JSONB NOT NULL DEFAULT '{}',
  "location" JSONB,
  "ipAddress" VARCHAR(45),
  "userAgent" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB DEFAULT '{}'
);

-- Indexes for query performance
CREATE INDEX "idx_voucher_scan_voucher_id" ON "VoucherScan"("voucherId");
CREATE INDEX "idx_voucher_scan_user_id" ON "VoucherScan"("userId") WHERE "userId" IS NOT NULL;
CREATE INDEX "idx_voucher_scan_created_at" ON "VoucherScan"("createdAt");
CREATE INDEX "idx_voucher_scan_type" ON "VoucherScan"("scanType");
```

### 3. Create CustomerVoucher Table

```sql
-- Track vouchers claimed to customer wallets
CREATE TABLE IF NOT EXISTS "CustomerVoucher" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "customerId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "voucherId" UUID NOT NULL REFERENCES "Voucher"("id") ON DELETE CASCADE,
  "claimedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "status" VARCHAR(20) NOT NULL DEFAULT 'CLAIMED' CHECK ("status" IN ('CLAIMED', 'REDEEMED', 'EXPIRED')),
  "walletOrder" INTEGER NOT NULL DEFAULT 0,
  "notificationPreferences" JSONB DEFAULT '{}',
  "lastViewedAt" TIMESTAMP WITH TIME ZONE,
  "metadata" JSONB DEFAULT '{}',
  CONSTRAINT "unique_customer_voucher" UNIQUE ("customerId", "voucherId")
);

-- Indexes for query performance
CREATE INDEX "idx_customer_voucher_customer_id" ON "CustomerVoucher"("customerId");
CREATE INDEX "idx_customer_voucher_voucher_id" ON "CustomerVoucher"("voucherId");
CREATE INDEX "idx_customer_voucher_status" ON "CustomerVoucher"("status");
CREATE INDEX "idx_customer_voucher_claimed_at" ON "CustomerVoucher"("claimedAt");
```

### 4. Create RedemptionAttempt Table

```sql
-- Track all redemption attempts for fraud detection
CREATE TABLE IF NOT EXISTS "RedemptionAttempt" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "voucherId" UUID NOT NULL REFERENCES "Voucher"("id") ON DELETE CASCADE,
  "businessId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "customerId" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "attemptedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "successful" BOOLEAN NOT NULL DEFAULT FALSE,
  "failureReason" VARCHAR(100),
  "deviceInfo" JSONB NOT NULL DEFAULT '{}',
  "location" JSONB,
  "metadata" JSONB DEFAULT '{}'
);

-- Indexes for query performance
CREATE INDEX "idx_redemption_attempt_voucher_id" ON "RedemptionAttempt"("voucherId");
CREATE INDEX "idx_redemption_attempt_business_id" ON "RedemptionAttempt"("businessId");
CREATE INDEX "idx_redemption_attempt_attempted_at" ON "RedemptionAttempt"("attemptedAt");
CREATE INDEX "idx_redemption_attempt_successful" ON "RedemptionAttempt"("successful");
```

## Prisma Schema Updates

Add these models to your schema.prisma:

```prisma
model VoucherScan {
  id          String   @id @default(uuid())
  voucherId   String
  userId      String?
  scanType    String   // CUSTOMER or BUSINESS
  scanSource  String   // CAMERA, GALLERY, LINK, SHARE
  deviceInfo  Json
  location    Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  metadata    Json     @default("{}")

  voucher     Voucher  @relation(fields: [voucherId], references: [id], onDelete: Cascade)
  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([voucherId])
  @@index([userId])
  @@index([createdAt])
  @@index([scanType])
}

model CustomerVoucher {
  id                      String   @id @default(uuid())
  customerId              String
  voucherId               String
  claimedAt               DateTime @default(now())
  status                  String   @default("CLAIMED") // CLAIMED, REDEEMED, EXPIRED
  walletOrder             Int      @default(0)
  notificationPreferences Json     @default("{}")
  lastViewedAt            DateTime?
  metadata                Json     @default("{}")

  customer                User     @relation(fields: [customerId], references: [id], onDelete: Cascade)
  voucher                 Voucher  @relation(fields: [voucherId], references: [id], onDelete: Cascade)

  @@unique([customerId, voucherId])
  @@index([customerId])
  @@index([voucherId])
  @@index([status])
  @@index([claimedAt])
}

model RedemptionAttempt {
  id            String   @id @default(uuid())
  voucherId     String
  businessId    String
  customerId    String?
  attemptedAt   DateTime @default(now())
  successful    Boolean  @default(false)
  failureReason String?
  deviceInfo    Json     @default("{}")
  location      Json?
  metadata      Json     @default("{}")

  voucher       Voucher  @relation(fields: [voucherId], references: [id], onDelete: Cascade)
  business      User     @relation("BusinessRedemptionAttempts", fields: [businessId], references: [id], onDelete: Cascade)
  customer      User?    @relation("CustomerRedemptionAttempts", fields: [customerId], references: [id], onDelete: SetNull)

  @@index([voucherId])
  @@index([businessId])
  @@index([attemptedAt])
  @@index([successful])
}
```

## Implementation Steps

### 1. Run Database Migrations

```bash
# Generate Prisma migration
npx prisma migrate dev --name add_customer_voucher_scanning

# Apply migration to production
npx prisma migrate deploy
```

### 2. Update Repository Implementations

Implement the new methods in `PrismaVoucherWriteRepository`:

```typescript
async trackScan(scan: ScanData): Promise<string> {
  const result = await this.prisma.voucherScan.create({
    data: scan,
  });
  return result.id;
}

async incrementScanCount(voucherId: string): Promise<void> {
  await this.prisma.voucher.update({
    where: { id: voucherId },
    data: { scanCount: { increment: 1 } },
  });
}

async createCustomerVoucher(claim: ClaimData): Promise<void> {
  await this.prisma.customerVoucher.create({
    data: claim,
  });
}
```

### 3. Register New Routes

Update the voucher service server.ts to include scan routes:

```typescript
// In createVoucherServer function
import { voucherScanRouter } from './write/api/routes/VoucherScanRouter.js'

// Register scan routes
await app.register(voucherScanRouter, {
  prefix: '/api/v1',
  controller: voucherScanController,
})
```

### 4. Update API Gateway

Add the new routes to the API gateway configuration:

```typescript
// In packages/api-gateway/src/config/gateway.ts
{
  path: '/vouchers/:voucherId/scan',
  target: VOUCHER_API_URL,
  methods: ['POST'],
  auth: 'optional', // Can track anonymous scans
},
{
  path: '/vouchers/:voucherId/claim',
  target: VOUCHER_API_URL,
  methods: ['POST'],
  auth: 'required',
  roles: ['CUSTOMER'],
}
```

### 5. Add Analytics Endpoints

Create endpoints for viewing scan analytics:

```typescript
// GET /vouchers/:voucherId/analytics
{
  totalScans: 1523,
  uniqueUsers: 892,
  scansByType: {
    CUSTOMER: 1420,
    BUSINESS: 103
  },
  scansBySource: {
    CAMERA: 1200,
    LINK: 200,
    SHARE: 100,
    GALLERY: 23
  },
  conversionRate: 0.45,
  averageTimeToRedeem: "3.5 days"
}
```

## Testing

### 1. Unit Tests

```typescript
describe('VoucherScanCommandHandler', () => {
  it('should track customer scan', async () => {
    // Test scan tracking
  })

  it('should increment scan counter', async () => {
    // Test counter increment
  })

  it('should detect already claimed vouchers', async () => {
    // Test claim detection
  })
})
```

### 2. Integration Tests

```typescript
describe('Voucher Scan Flow', () => {
  it('should handle complete scan to claim flow', async () => {
    // 1. Create voucher
    // 2. Customer scans QR
    // 3. Verify scan tracked
    // 4. Customer claims voucher
    // 5. Verify claim recorded
    // 6. Business redeems
    // 7. Verify status updated
  })
})
```

### 3. Load Tests

Test high-volume scanning scenarios:

- 1000 concurrent scans
- Multiple scans of same voucher
- Scan rate limiting

## Monitoring

### Key Metrics

1. **Scan Metrics**
   - Scans per minute/hour
   - Unique scanners per day
   - Scan-to-claim conversion rate
   - Geographic distribution

2. **Claim Metrics**
   - Claims per voucher
   - Time from scan to claim
   - Wallet size distribution
   - Claim-to-redemption rate

3. **Performance Metrics**
   - Scan endpoint latency
   - Database query time
   - Cache hit rate

### Alerts

Configure alerts for:

- Scan rate anomalies (potential abuse)
- Low conversion rates
- High failure rates
- Database performance issues

## Rollback Plan

If issues arise:

1. **Feature Flag**: Disable scan endpoints via feature flag
2. **Database**: Keep old redemption flow operational
3. **Revert**: Run migration rollback if needed
4. **Cache**: Clear any cached scan data

## Timeline

- Week 1: Database migrations and models
- Week 2: Repository and handler implementation
- Week 3: API endpoints and integration
- Week 4: Testing and monitoring setup
- Week 5: Gradual rollout with feature flags
