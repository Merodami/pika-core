# Voucher Service

## Overview

The Voucher Service is a core microservice in the PIKA platform that manages digital discount vouchers/coupons. It handles the complete voucher lifecycle from creation to expiration, supporting both digital (app-based) and physical (printed) voucher redemptions with robust offline capabilities.

## Port

- **Development Port**: 4006

## Key Features

### Voucher Lifecycle Management

- **States**: NEW → PUBLISHED → CLAIMED → REDEEMED → EXPIRED
- Automatic state transitions based on business rules
- Support for scheduled publishing
- Expiration handling

### Multi-Code System

1. **QR Codes**: JWT-based secure tokens for digital redemptions
2. **Short Codes**: Human-readable alphanumeric codes (e.g., SAVE-2024)
3. **Static Codes**: For printed vouchers with campaign-based tracking

### Security Features

- JWT tokens signed with ECDSA (ES256)
- One-time use enforcement per user
- Offline validation capabilities
- Rate limiting and fraud prevention

### Geospatial Support

- Location-based voucher discovery ("near me")
- PostGIS integration for efficient spatial queries
- Radius-based filtering

### Multilingual Support

- Content in Spanish (es), English (en), Guaraní (gn), Portuguese (pt)
- Fallback language handling
- Localized terms and conditions

## Business Rules

### Voucher Creation

1. **Creators**: Only service providers and admins can create vouchers
2. **Required Fields**:
   - Title (multilingual)
   - Description (multilingual)
   - Terms & Conditions
   - Expiration date
   - Category ID
   - Location (point or polygon)
   - Discount details (percentage or fixed amount)
3. **Optional Fields**:
   - Maximum redemptions (total)
   - Maximum redemptions per user
   - Valid from date (for scheduled activation)
   - Image URL
   - Campaign tags

### Voucher States

#### NEW

- Initial state after creation
- Not visible to customers
- Can be edited freely
- Can be deleted

#### PUBLISHED

- Visible to customers in the app
- Can be claimed by customers
- Limited editing allowed (only certain fields)
- Cannot be deleted (must expire instead)

#### CLAIMED

- Per-user state tracking
- User has expressed intent to use
- Appears in user's "wallet"
- Can be unclaimed by user

#### REDEEMED

- Voucher has been used
- One redemption per user per voucher
- Cannot be re-redeemed
- Triggers notifications

#### EXPIRED

- Past expiration date or max redemptions reached
- No longer visible in active lists
- Cannot be claimed or redeemed
- Archived for analytics

### Redemption Rules

#### Digital Redemptions (App-based)

1. Customer presents QR code from app
2. Provider scans with their app
3. System validates:
   - JWT signature
   - Token expiration (short TTL: 5 minutes)
   - User authorization
   - Previous redemption check
4. Records redemption with timestamp and location

#### Static Code Redemptions (Printed vouchers)

1. Customer presents printed voucher with static code
2. Provider enters code manually
3. System tracks:
   - Campaign-level redemptions
   - Per-provider counts
   - No per-user validation required
4. Encourages app download post-redemption

#### Offline Redemption Support

1. Provider app validates JWT signature offline using public key
2. Checks token TTL hasn't expired
3. Stores redemption locally
4. Syncs when connectivity restored
5. Server reconciles any conflicts

### Security & Fraud Prevention

1. **One Redemption Per User**: Backend enforces single use per authenticated user
2. **Rate Limiting**: Monitors unusual redemption patterns
3. **Token Security**:
   - Short-lived tokens (5 min for digital, campaign duration for print)
   - ECDSA signatures prevent forgery
   - Unique nonces prevent replay attacks
4. **Audit Trail**: All redemption attempts logged

### Geolocation Features

1. **Voucher Discovery**:
   - "Near me" searches using PostGIS ST_DWithin
   - Configurable search radius (default: 10km)
   - Distance-based sorting
2. **Redemption Tracking**:
   - Location recorded for each redemption
   - Heatmap analytics support
   - Regional performance metrics

## API Endpoints

### Customer Endpoints

- `GET /vouchers` - List available vouchers with filters
- `GET /vouchers/:id` - Get voucher details
- `POST /vouchers/:id/claim` - Claim a voucher
- `DELETE /vouchers/:id/claim` - Unclaim a voucher
- `GET /vouchers/:id/qr` - Generate QR code for claimed voucher

### Provider Endpoints

- `POST /vouchers` - Create new voucher
- `PATCH /vouchers/:id` - Update voucher
- `POST /vouchers/:id/publish` - Publish voucher
- `GET /vouchers/provider/:provider_id` - List provider's vouchers
- `POST /vouchers/validate` - Validate voucher code

### Admin Endpoints

- `GET /admin/vouchers` - List all vouchers with filters
- `PATCH /admin/vouchers/:id` - Admin voucher updates
- `POST /admin/vouchers/:id/expire` - Force expire voucher
- `GET /admin/vouchers/analytics` - Voucher analytics

### Inter-Service Endpoints

- `PUT /vouchers/:id/state` - Update voucher state (service-to-service only)
  - Requires service authentication headers: x-api-key, x-service-name
  - Used by Redemption Service to update state after successful redemption
  - Validates state transitions and increments redemption count

## Data Models

### Voucher Entity

```typescript
{
  id: string (UUID)
  providerId: string
  categoryId: string
  state: VoucherState
  title: LocalizedContent
  description: LocalizedContent
  terms: LocalizedContent
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discountValue: number
  currency: string
  location: GeoJSON Point/Polygon
  imageUrl?: string
  validFrom: Date
  expiresAt: Date
  maxRedemptions?: number
  maxRedemptionsPerUser: number
  currentRedemptions: number
  metadata: JSON
  createdAt: Date
  updatedAt: Date
}
```

### VoucherClaim Entity

```typescript
{
  id: string (UUID)
  voucherId: string
  userId: string
  claimedAt: Date
  unclaimedAt?: Date
}
```

### VoucherCode Entity

```typescript
{
  id: string(UUID)
  voucherId: string
  code: string
  type: 'QR' | 'SHORT' | 'STATIC'
  isActive: boolean
  metadata: JSON
}
```

## Integration Points

### Dependencies

- **@pika/database**: PostgreSQL with PostGIS
- **@pika/redis**: Caching frequently accessed vouchers
- **@pika/auth**: JWT validation and user context
- **@pika/notification**: Redemption confirmations
- **@pika/shared**: Common utilities and error handling

### External Services

- **Category Service**: Voucher categorization
- **User Service**: Provider verification
- **Review Service**: Post-redemption reviews
- **Redemption Service**: Updates voucher state via authenticated service calls

## Development

### Running the Service

```bash
# Development
yarn nx run @pika/voucher:local

# Testing
yarn nx run @pika/voucher:test

# Building
yarn nx run @pika/voucher:build
```

### Environment Variables

```env
# Service Configuration
VOUCHER_SERVICE_PORT=4006

# Security
JWT_PUBLIC_KEY=<ECDSA public key for QR validation>
JWT_PRIVATE_KEY=<ECDSA private key for QR generation>

# Features
ENABLE_STATIC_CODES=true
ENABLE_OFFLINE_VALIDATION=true
DEFAULT_SEARCH_RADIUS_KM=10
```

## Architecture

The service follows Domain-Driven Design (DDD) with CQRS pattern:

```
src/
├── read/           # Query side
│   ├── api/        # HTTP endpoints
│   ├── application/# Use cases (GetVouchersHandler, etc.)
│   ├── domain/     # Read models and ports
│   └── infrastructure/# PostgreSQL/Redis implementations
└── write/          # Command side
    ├── api/        # HTTP endpoints
    ├── application/# Use cases (CreateVoucherHandler, etc.)
    ├── domain/     # Entities, value objects, events
    └── infrastructure/# PostgreSQL implementations
```

## Security Considerations

1. **JWT Token Security**: All QR codes use ECDSA-signed JWTs
2. **Rate Limiting**: Applied at API Gateway and service level
3. **Input Validation**: Strict validation on all inputs
4. **SQL Injection**: Prevented via Prisma ORM
5. **XSS Prevention**: Output encoding for all user content

## Performance Optimizations

1. **Redis Caching**:
   - Popular vouchers cached with TTL
   - Geospatial query results cached
   - Short code mappings cached
2. **Database Indexing**:
   - Spatial index on location field
   - Composite index on (state, expiresAt)
   - Index on providerId for filtering
3. **Pagination**: All list endpoints support pagination

## Monitoring & Metrics

Key metrics to monitor:

- Voucher creation rate
- Redemption success rate
- Average redemption time
- Offline sync success rate
- Cache hit rate
- API response times

## Future Enhancements

1. **Dynamic Pricing**: Time-based discount adjustments
2. **Voucher Templates**: Reusable voucher configurations
3. **A/B Testing**: Multiple variants per campaign
4. **Advanced Analytics**: ML-based redemption predictions
5. **Social Sharing**: Share vouchers with referral tracking
