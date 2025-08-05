# Voucher Service Implementation Plan

## Overview

This document outlines the step-by-step implementation plan for converting the existing category service into a fully functional voucher service that meets all PIKA platform requirements.

## Phase 1: API Documentation & Database Schema (Day 1-2)

### 1.1 Create OpenAPI Documentation

**Location**: `packages/api/src/routes/marketplace/voucher.ts`

```typescript
// Define voucher-related schemas and endpoints
- VoucherSchema (with multilingual fields)
- VoucherClaimSchema
- VoucherCodeSchema
- VoucherRedemptionSchema
- All CRUD endpoints for vouchers
- Claim/unclaim endpoints
- Validation endpoints
- Admin endpoints
```

### 1.2 Update Database Schema

**Location**: `packages/database/prisma/schema.prisma`

```prisma
// Add new models:
model Voucher {
  id                    String              @id @default(uuid())
  retailerId            String
  categoryId            String
  state                 VoucherState        @default(NEW)
  titleEs               String
  titleEn               String
  titleGn               String?
  titlePt               String?
  descriptionEs         String              @db.Text
  descriptionEn         String              @db.Text
  descriptionGn         String?             @db.Text
  descriptionPt         String?             @db.Text
  termsEs               String              @db.Text
  termsEn               String              @db.Text
  termsGn               String?             @db.Text
  termsPt               String?             @db.Text
  discountType          DiscountType
  discountValue         Float
  currency              String              @default("PYG")
  location              Json                // PostGIS geometry
  imageUrl              String?
  validFrom             DateTime            @default(now())
  expiresAt             DateTime
  maxRedemptions        Int?
  maxRedemptionsPerUser Int                 @default(1)
  currentRedemptions    Int                 @default(0)
  metadata              Json?
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt

  // Relations
  retailer              User                @relation(fields: [retailerId], references: [id])
  category              Category            @relation(fields: [categoryId], references: [id])
  claims                VoucherClaim[]
  codes                 VoucherCode[]
  redemptions           VoucherRedemption[]

  @@index([state, expiresAt])
  @@index([retailerId])
  @@index([categoryId])
  @@index([location], type: Gist)
}

model VoucherClaim {
  id          String    @id @default(uuid())
  voucherId   String
  userId      String
  claimedAt   DateTime  @default(now())
  unclaimedAt DateTime?

  voucher     Voucher   @relation(fields: [voucherId], references: [id])
  user        User      @relation(fields: [userId], references: [id])

  @@unique([voucherId, userId])
  @@index([userId])
}

model VoucherCode {
  id        String    @id @default(uuid())
  voucherId String
  code      String    @unique
  type      CodeType
  isActive  Boolean   @default(true)
  metadata  Json?

  voucher   Voucher   @relation(fields: [voucherId], references: [id])

  @@index([code])
  @@index([voucherId])
}

model VoucherRedemption {
  id            String    @id @default(uuid())
  voucherId     String
  userId        String?
  retailerId    String
  code          String
  location      Json?     // PostGIS point
  redeemedAt    DateTime  @default(now())
  syncedAt      DateTime?
  metadata      Json?

  voucher       Voucher   @relation(fields: [voucherId], references: [id])
  user          User?     @relation(fields: [userId], references: [id])
  retailer      User      @relation("RetailerRedemptions", fields: [retailerId], references: [id])

  @@index([voucherId])
  @@index([userId])
  @@index([retailerId])
}

enum VoucherState {
  NEW
  PUBLISHED
  EXPIRED
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}

enum CodeType {
  QR
  SHORT
  STATIC
}
```

### 1.3 Run Database Migration

```bash
yarn db:generate
yarn db:migrate
```

## Phase 2: Domain Models & Types (Day 3)

### 2.1 Create Domain Entities

**Location**: `packages/services/voucher/src/write/domain/entities/`

- `Voucher.ts` - Main voucher entity with business logic
- `VoucherClaim.ts` - Claim tracking entity
- `VoucherCode.ts` - Code generation value object
- `VoucherRedemption.ts` - Redemption record entity

### 2.2 Create DTOs

**Location**: `packages/services/voucher/src/write/domain/dtos/`

- `VoucherDTO.ts` - Data transfer objects
- `CreateVoucherDTO.ts`
- `UpdateVoucherDTO.ts`
- `ClaimVoucherDTO.ts`
- `RedeemVoucherDTO.ts`

### 2.3 Define Repository Ports

**Location**: `packages/services/voucher/src/write/domain/port/`

- `VoucherWriteRepositoryPort.ts`
- `VoucherClaimRepositoryPort.ts`
- `VoucherRedemptionRepositoryPort.ts`

## Phase 3: Use Cases Implementation (Day 4-5)

### 3.1 Write Side Use Cases

**Location**: `packages/services/voucher/src/write/application/use_cases/commands/`

- `CreateVoucherCommandHandler.ts` - Create new voucher
- `UpdateVoucherCommandHandler.ts` - Update voucher details
- `PublishVoucherCommandHandler.ts` - Change state to PUBLISHED
- `ExpireVoucherCommandHandler.ts` - Force expiration
- `ClaimVoucherCommandHandler.ts` - User claims voucher
- `UnclaimVoucherCommandHandler.ts` - User unclaims voucher
- `ValidateVoucherCommandHandler.ts` - Validate QR/short code
- `RedeemVoucherCommandHandler.ts` - Process redemption

### 3.2 Read Side Use Cases

**Location**: `packages/services/voucher/src/read/application/use_cases/queries/`

- `GetAllVouchersHandler.ts` - List vouchers with filters
- `GetVoucherByIdHandler.ts` - Get single voucher
- `GetNearbyVouchersHandler.ts` - Geospatial search
- `GetMyVouchersHandler.ts` - User's claimed vouchers
- `GetRetailerVouchersHandler.ts` - Retailer's vouchers
- `GenerateQRCodeHandler.ts` - Generate QR for claimed voucher

### 3.3 Adapters

**Location**: `packages/services/voucher/src/write/application/adapters/`

- `QRCodeGenerator.ts` - JWT-based QR generation
- `ShortCodeGenerator.ts` - Human-readable code generation
- `GeospatialAdapter.ts` - PostGIS query builder
- `OfflineValidator.ts` - Offline JWT validation

## Phase 4: Infrastructure Implementation (Day 6)

### 4.1 Repository Implementations

**Location**: `packages/services/voucher/src/write/infrastructure/persistence/pgsql/`

- `PrismaVoucherWriteRepository.ts`
- `PrismaVoucherClaimRepository.ts`
- `PrismaVoucherRedemptionRepository.ts`

**Location**: `packages/services/voucher/src/read/infrastructure/persistence/pgsql/`

- `PrismaVoucherReadRepository.ts`
- `PrismaVoucherClaimReadRepository.ts`

### 4.2 External Service Integrations

**Location**: `packages/services/voucher/src/write/infrastructure/services/`

- `NotificationService.ts` - Send redemption confirmations
- `CategoryService.ts` - Validate category exists
- `RetailerService.ts` - Validate retailer

## Phase 5: API Controllers & Routes (Day 7)

### 5.1 Write Controllers

**Location**: `packages/services/voucher/src/write/api/controllers/`

- `VoucherController.ts` - Create, update, publish
- `VoucherClaimController.ts` - Claim/unclaim
- `VoucherRedemptionController.ts` - Validate and redeem

### 5.2 Read Controllers

**Location**: `packages/services/voucher/src/read/api/controllers/`

- `VoucherController.ts` - List and retrieve vouchers
- `VoucherQRController.ts` - Generate QR codes

### 5.3 Routes

**Location**: `packages/services/voucher/src/write/api/routes/`

- `VoucherRouter.ts` - All voucher routes
- `AdminVoucherRouter.ts` - Admin-only routes

## Phase 6: Testing (Day 8-9)

### 6.1 Unit Tests

- Domain entity tests
- Use case tests
- Adapter tests

### 6.2 Integration Tests

**Location**: `packages/services/voucher/src/test/integration/`

- `voucher-crud.integration.test.ts`
- `voucher-claim.integration.test.ts`
- `voucher-redemption.integration.test.ts`
- `voucher-geospatial.integration.test.ts`

### 6.3 E2E Tests

- Complete voucher lifecycle test
- Offline redemption simulation
- Multi-language content test

## Phase 7: Service Configuration (Day 10)

### 7.1 Update Service Configuration

- Update `app.ts` with correct service name
- Configure JWT keys for QR generation
- Set up Redis caching
- Configure PostGIS extensions

### 7.2 Update API Gateway

**Location**: `packages/api-gateway/src/config/gateway.ts`

- Add voucher service routes
- Configure rate limiting for redemption endpoints

### 7.3 Environment Variables

- Add voucher-specific config to `.env`
- Document all new variables

## Phase 8: Documentation & Deployment (Day 11)

### 8.1 Update Documentation

- API documentation with examples
- Postman collection
- Architecture diagrams

### 8.2 Deployment Configuration

- Docker configuration
- Health check endpoints
- Monitoring setup

## Implementation Order

1. **Start with API Docs** - Define contracts first
2. **Database Schema** - Create foundation
3. **Domain Models** - Business logic core
4. **Use Cases** - Application logic
5. **Infrastructure** - External integrations
6. **Controllers** - HTTP layer
7. **Testing** - Validate everything
8. **Configuration** - Production ready

## Key Technical Decisions

### JWT Token Structure for QR

```typescript
{
  voucherId: string,
  userId?: string,
  redemptionId: string, // unique per generation
  exp: number, // 5 minutes for digital
  iat: number,
  iss: "pika-voucher-service"
}
```

### Short Code Format

- 8 characters: XXXX-XXXX
- Alphabet: 23456789ABCDEFGHJKLMNPQRSTUVWXYZ (no ambiguous chars)
- Example: SAVE-2024, DEAL-5XYZ

### Caching Strategy

- Popular vouchers: 5 min TTL
- Geospatial results: 2 min TTL
- Short code mappings: 10 min TTL
- User claims: Real-time (no cache)

### Geospatial Queries

```sql
-- Example PostGIS query for nearby vouchers
SELECT * FROM vouchers
WHERE ST_DWithin(
  location::geography,
  ST_MakePoint(:lng, :lat)::geography,
  :radiusMeters
)
AND state = 'PUBLISHED'
AND expires_at > NOW()
ORDER BY ST_Distance(
  location::geography,
  ST_MakePoint(:lng, :lat)::geography
);
```

## Success Criteria

1. All endpoints return correct data
2. QR codes validate offline
3. One redemption per user enforced
4. Geospatial search works within 100ms
5. Multi-language content displays correctly
6. All tests pass with >80% coverage
7. Service handles 100 req/sec

## Risks & Mitigations

1. **Risk**: QR code size too large
   - **Mitigation**: Use compact JWT claims, consider compression

2. **Risk**: Offline sync conflicts
   - **Mitigation**: Server timestamp authority, clear conflict resolution

3. **Risk**: Database performance with location queries
   - **Mitigation**: Proper PostGIS indexes, query optimization

4. **Risk**: Short code collisions
   - **Mitigation**: Check uniqueness on generation, retry logic

## Dependencies on Other Teams

1. **Database Team**: PostGIS extension setup
2. **DevOps**: JWT key management
3. **Frontend**: QR scanner implementation
4. **Security**: ECDSA key generation

## Timeline Summary

- **Week 1**: API docs, database, domain models
- **Week 2**: Use cases, infrastructure, controllers
- **Week 3**: Testing, configuration, deployment

Total estimated time: 11-15 working days
