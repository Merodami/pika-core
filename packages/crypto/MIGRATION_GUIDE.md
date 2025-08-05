# Migration Guide: Using @pika/crypto in Services

This guide helps you migrate from custom cryptographic implementations to using the @pika/crypto package.

## Redemption Service Migration

### Before (Custom Implementation)

```typescript
// In redemption service
import { JWTService } from './infrastructure/services/JWTService'
import { ShortCodeService } from './infrastructure/services/ShortCodeService'

const jwtService = new JWTService()
const shortCodeService = new ShortCodeService()

// Generate QR
const token = await jwtService.generateToken({
  voucherId,
  userId,
  exp: Date.now() + 300000,
})
```

### After (Using @pika/crypto)

```typescript
// In redemption service
import { VoucherQRService, ShortCodeService as CryptoShortCodeService, ECDSAService, KeyManager } from '@pika/crypto'

// Initialize services
const ecdsa = new ECDSAService({ curve: 'P-256' })
const keyPair = await ecdsa.generateKeyPair()

const qrService = new VoucherQRService({
  algorithm: 'ES256',
  issuer: 'pika-redemption-service',
  audience: 'pika-vouchers',
})

const shortCodeService = new CryptoShortCodeService({
  secretKey: process.env.SHORT_CODE_SECRET!,
  codeLength: 8,
  includeChecksum: true,
})

// Generate QR with proper voucher claims
const qrResult = await qrService.generateUserVoucherQR(voucherId, userId, keyPair.privateKey, { ttl: 300 })

// Validate QR
const validation = await qrService.validateQR(qrPayload, keyPair.publicKey)
```

## Key Differences

### 1. Voucher-Specific Claims

The crypto package uses standardized voucher claims:

```typescript
interface RedemptionClaims {
  vid: string // Voucher ID
  uid?: string // User ID (for user vouchers)
  typ: 'user' | 'print' // Token type
  btc?: string // Batch code (for print vouchers)
  lmt?: number // Redemption limit
  pid?: string // Provider ID
}
```

### 2. Optimized QR Generation

```typescript
// Mobile-optimized QR codes
const qr = await qrService.generateUserVoucherQROptimized(voucherId, userId, privateKey, {
  optimizeForMobile: true,
  enableCaching: true,
})

// Batch generation for print vouchers
const batch = await qrService.generatePrintVoucherBatch(vouchers, privateKey, {
  batchPrefix: 'PIKA',
  ttl: 86400 * 30,
  limit: 100,
})
```

### 3. Enhanced Validation

```typescript
// Rich validation results
const result = await qrService.validateQREnhanced(qrPayload, publicKey, {
  providerId: 'provider-123',
  location: { lat, lng },
  requireSpecificVoucher: voucherId,
})

// Returns:
// - isValid: boolean
// - voucherInfo: detailed voucher data
// - validationErrors: specific error messages
// - securityWarnings: potential security issues
// - recommendations: suggested actions
```

### 4. Offline Support

```typescript
import { OfflineCodeValidator } from '@pika/crypto'

const validator = new OfflineCodeValidator({
  validationKey: publicKey,
  allowedClockSkew: 300,
})

// Validate without network
const offlineResult = await validator.validateOffline(code, {
  publicKey,
  cacheResult: true,
})

// Generate rules for offline providers
const rules = validator.generateOfflineRules(vouchers)
```

## Environment Variables

Add these to your service:

```bash
# Key management
CRYPTO_REDIS_PREFIX=crypto:keys:redemption
CRYPTO_KEY_ROTATION_DAYS=7
CRYPTO_KEY_OVERLAP_HOURS=1

# Short codes
SHORT_CODE_SECRET=your-32-character-secret-key-here
SHORT_CODE_LENGTH=8

# JWT configuration
JWT_ISSUER=pika-redemption-service
JWT_AUDIENCE=pika-platform
JWT_DEFAULT_TTL=300
```

## Testing

Update your tests to use crypto mocks:

```typescript
import { vi } from 'vitest'

// Mock crypto services
vi.mock('@pika/crypto', () => ({
  VoucherQRService: vi.fn().mockImplementation(() => ({
    generateUserVoucherQR: vi.fn().mockResolvedValue({
      qrPayload: 'mock-jwt-token',
      claims: { vid: 'test-voucher', uid: 'test-user' },
    }),
    validateQR: vi.fn().mockResolvedValue({
      isValid: true,
      voucherInfo: { voucherId: 'test-voucher' },
    }),
  })),
}))
```

## Best Practices

1. **Key Management**: Always use KeyManager for production
2. **Error Handling**: Crypto errors are typed - handle them specifically
3. **Caching**: Enable QR caching for frequently accessed vouchers
4. **Monitoring**: Track crypto operations with audit logs
5. **Security**: Never log private keys or full JWT tokens

## Common Issues

### Issue: "Invalid key length"

**Solution**: Ensure secret keys are at least 32 characters

### Issue: "Token expired" during development

**Solution**: Use `allowExpired: true` option for testing

### Issue: High memory usage with batch generation

**Solution**: Process vouchers in chunks of 100-200

### Issue: Slow QR validation

**Solution**: Enable caching and use `validateQREnhanced` with context
