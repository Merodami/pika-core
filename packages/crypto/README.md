# @pika/crypto

A comprehensive cryptographic utilities package for the PIKA voucher platform, providing secure token generation, QR code creation, and voucher validation. This package implements industry-standard cryptographic operations specifically tailored for voucher redemption scenarios.

## Features

- **ECDSA Operations**: Support for multiple curves (P-256, P-384, P-521, secp256k1)
- **JWT Management**: Secure token creation and validation with key rotation support
- **Voucher QR Codes**: Optimized QR code generation for mobile scanning with JWT payloads
- **Short Codes**: Human-readable fallback codes for offline redemption
- **Key Management**: Automated key generation, storage, and rotation with Redis
- **Offline Validation**: Support for voucher validation in disconnected environments
- **Security Best Practices**: Cryptographically secure random generation, timing-safe comparisons, proper error handling

## Installation

```bash
yarn add @pika/crypto
```

## Quick Start

```typescript
import { VoucherQRService, ECDSAService } from '@pika/crypto'

// 1. Generate keys
const ecdsa = new ECDSAService({ curve: 'P-256' })
const keyPair = await ecdsa.generateKeyPair()

// 2. Create QR service
const qrService = new VoucherQRService({
  algorithm: 'ES256',
  issuer: 'pika-voucher-service',
  audience: 'pika-redemption-service',
})

// 3. Generate voucher QR code
const qr = await qrService.generateUserVoucherQR('voucher-123', 'user-456', keyPair.privateKey)

// 4. Validate at redemption
const valid = await qrService.validateQR(qr.qrPayload, keyPair.publicKey)
```

## Usage

### ECDSA Operations

```typescript
import { ECDSAService } from '@pika/crypto/ecdsa'

const ecdsa = new ECDSAService({ curve: 'P-256' })

// Generate a key pair
const keyPair = await ecdsa.generateKeyPair()

// Sign a message
const signature = await ecdsa.sign(Buffer.from('Hello World'), keyPair.privateKey)

// Verify a signature
const isValid = await ecdsa.verify(Buffer.from('Hello World'), signature, keyPair.publicKey)
```

### JWT Operations

```typescript
import { JWTService } from '@pika/crypto'

const jwt = new JWTService({
  algorithm: 'ES256',
  issuer: 'pika-platform',
  audience: 'pika-vouchers',
  defaultTTL: 300, // 5 minutes
})

// Create a token
const token = await jwt.generateToken({ sub: 'user:123', scope: 'read:vouchers' }, privateKey, 300)

// Verify a token
const result = await jwt.verifyToken(token, publicKey)
```

### Voucher QR Code Generation

```typescript
import { VoucherQRService, ECDSAService } from '@pika/crypto'

// Initialize services
const ecdsa = new ECDSAService({ curve: 'P-256' })
const keyPair = await ecdsa.generateKeyPair()

const qrService = new VoucherQRService({
  algorithm: 'ES256',
  issuer: 'pika-voucher-service',
  audience: 'pika-redemption-service',
})

// Generate user voucher QR (short TTL for real-time redemption)
const userQR = await qrService.generateUserVoucherQROptimized('voucher-123', 'user-456', keyPair.privateKey, {
  ttl: 300, // 5 minutes
  optimizeForMobile: true,
})

// Generate print voucher batch (long TTL for physical vouchers)
const printBatch = await qrService.generatePrintVoucherBatch(
  [
    { voucherId: 'v1', title: '20% Off Coffee' },
    { voucherId: 'v2', title: 'Buy 1 Get 1 Pizza' },
  ],
  keyPair.privateKey,
  {
    batchPrefix: 'PIKA',
    ttl: 86400 * 30, // 30 days
    limit: 100,
    campaignId: 'SUMMER-2025',
  },
)

// Validate QR code
const validation = await qrService.validateQREnhanced(userQR.qrPayload, keyPair.publicKey, {
  providerId: 'provider-789',
  location: { lat: -25.2637, lng: -57.5759 },
})
```

### Short Code Generation

```typescript
import { ShortCodeService, CodeGenerationUtils } from '@pika/crypto'

// Initialize short code service
const shortCodeService = new ShortCodeService({
  secretKey: 'your-32-char-secret-key-here',
  codeLength: 8,
  includeChecksum: true,
})

// Generate short code for voucher
const shortCode = await shortCodeService.generateShortCode('voucher-123', {
  userId: 'user-456',
  type: 'user',
  expirationDays: 1,
})

// Validate short code
const validation = await shortCodeService.validateShortCode(shortCode.shortCode, { checksum: shortCode.checksum })

// Generate human-friendly codes
const friendlyCode = await CodeGenerationUtils.generateShortCode({
  length: 8,
  includeDash: true,
  prefix: 'V',
}) // Returns: V3K9F-2X8M

// Generate alphanumeric codes (e.g., ABC-123)
const alphaNumCode = await CodeGenerationUtils.generateAlphaNumericCode(3, 3)
```

### Offline Validation

```typescript
import { OfflineCodeValidator } from '@pika/crypto'

// Initialize offline validator
const validator = new OfflineCodeValidator({
  validationKey: publicKey,
  allowedClockSkew: 300, // 5 minutes
})

// Validate offline with structural checks
const result = await validator.validateOffline(qrCode, {
  publicKey: publicKey,
  expectedVoucherId: 'voucher-123',
  allowExpired: false,
  cacheResult: true,
})

// Generate offline validation rules for providers
const rules = validator.generateOfflineRules([
  {
    voucherId: 'v1',
    shortCode: 'V3K9F-2X8M',
    type: 'user',
    expiresAt: new Date('2025-12-31'),
  },
])

// Sync cached validations when online
const syncResult = await validator.syncOfflineValidations()
```

### Key Management

```typescript
import { KeyManager } from '@pika/crypto'
import Redis from 'ioredis'

const redis = new Redis()

const keyManager = new KeyManager(
  {
    redisPrefix: 'crypto:keys',
    defaultTTL: 86400 * 30, // 30 days
    rotationPolicy: {
      maxAge: 86400 * 7, // 7 days
      overlap: 3600, // 1 hour
    },
  },
  redis,
)

// Store a key pair
await keyManager.storeKeyPair('ES256', keyPair)

// Get current signing key
const signingKey = await keyManager.getCurrentSigningKey('ES256')

// Rotate keys
const newKey = await keyManager.rotateKeys('ES256')

// Get public key set (for JWKS endpoint)
const jwks = await keyManager.getPublicKeySet()
```

## Testing

The package includes comprehensive test coverage for all cryptographic operations:

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Generate coverage report
yarn test:coverage
```

## Security Considerations

1. **Key Storage**: Private keys should never be stored in plain text. Use environment variables or secure key management services.

2. **Token TTL**: Keep token lifetimes as short as practical for your use case.

3. **Key Rotation**: Implement regular key rotation to limit exposure from potential compromises.

4. **Error Handling**: The package uses constant-time operations where applicable to prevent timing attacks.

## API Reference

### ECDSAService

- `generateKeyPair()`: Generate a new ECDSA key pair
- `sign(message, privateKey)`: Sign a message with ECDSA
- `verify(message, signature, publicKey)`: Verify an ECDSA signature
- `exportPublicKey(publicKey)`: Export public key in PEM format
- `importPublicKey(pem)`: Import public key from PEM

### JWTService

- `generateToken(claims, privateKey, ttl?)`: Create a signed JWT
- `verifyToken(token, publicKey)`: Verify and decode a JWT
- `decodeToken(token)`: Decode without verification (unsafe)

### VoucherQRService

- `generateUserVoucherQROptimized(voucherId, userId, privateKey, options?)`: Generate optimized QR for user vouchers
- `generatePrintVoucherBatch(vouchers, privateKey, options?)`: Generate batch QR codes for print
- `validateQREnhanced(qrPayload, publicKey, context?)`: Validate with enhanced error reporting
- `checkExpiration(qrPayload)`: Check if QR is near expiration
- `isExpiringSoon(qrPayload, threshold?)`: Check if QR expires within threshold

### ShortCodeService

- `generateShortCode(voucherId, options?)`: Generate human-readable short code
- `validateShortCode(shortCode, options?)`: Validate and extract voucher info
- `generateBatchShortCodes(vouchers, batchCode, options?)`: Generate batch of unique codes
- `validateBatch(shortCodes, options?)`: Validate multiple codes at once

### KeyManager

- `storeKeyPair(algorithm, keyPair)`: Store a key pair in Redis
- `getCurrentSigningKey(algorithm)`: Get current key for signing
- `rotateKeys(algorithm)`: Perform key rotation
- `getPublicKeySet(includeRotating?)`: Get JWKS-formatted public keys

## License

MIT
