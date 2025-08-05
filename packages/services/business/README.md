# 🏢 @pika/business-service - Business Management Microservice

![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?logo=typescript)
![Architecture](https://img.shields.io/badge/Architecture-Clean-green)
![API](https://img.shields.io/badge/API-REST-orange)
![Status](https://img.shields.io/badge/Status-Production-success)

## 🎯 Purpose & Vision

The Business Service is the **core business entity management system** for the Pika platform. It handles all business-related operations including registration, verification, profile management, and ratings. The service implements Clean Architecture principles with proper separation between public, admin, and internal APIs, ensuring secure and scalable business management across the platform.

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Run database migrations
yarn prisma:migrate

# Start development server
yarn nx run @pika/business:local

# Run tests
yarn nx run @pika/business:test

# Build for production
yarn nx run @pika/business:build
```

## 📋 Overview

The Business Service is a comprehensive business management system that:

- **Manages Business Entities**: Registration, profiles, verification
- **Handles Relationships**: User ownership, category associations
- **Supports i18n**: Translation keys for business names/descriptions
- **Provides Search**: Advanced filtering and geospatial queries
- **Enables Verification**: Business verification workflows
- **Tracks Ratings**: Average rating calculation and updates
- **Implements Caching**: Redis-backed performance optimization
- **Enforces Security**: Role-based access control

### Key Features

- 🏢 **Business Management**: CRUD operations with soft delete
- 🌐 **Multi-Language Support**: Translation key system
- 🔍 **Advanced Search**: Category, status, and location filters
- ✅ **Verification System**: Business verification workflow
- ⭐ **Rating Management**: Average rating tracking
- 🔐 **Access Control**: Public, admin, and internal APIs
- 🚀 **Performance**: Redis caching, optimized queries
- 📊 **Analytics Ready**: Business metrics and reporting

## 🏗️ Architecture

### Clean Architecture Layers

```
src/
├── controllers/                 # HTTP Request Handlers
│   ├── BusinessController.ts    # Public API endpoints
│   ├── AdminBusinessController.ts # Admin management
│   └── InternalBusinessController.ts # Service-to-service
├── services/                    # Business Logic Layer
│   └── BusinessService.ts       # Core business operations
├── repositories/                # Data Access Layer
│   └── BusinessRepository.ts    # Database operations
├── routes/                      # Route Definitions
│   ├── BusinessRoutes.ts        # Public routes
│   ├── AdminBusinessRoutes.ts   # Admin routes
│   └── InternalBusinessRoutes.ts # Internal routes
├── types/                       # Type Definitions
│   ├── search.ts               # Search parameters
│   └── index.ts                # Shared types
├── test/                        # Test Suite
│   ├── unit/                   # Unit tests
│   └── integration/            # Integration tests
├── app.ts                      # Application setup
├── server.ts                   # Server configuration
└── index.ts                    # Service entry point
```

### API Structure

```mermaid
graph TD
    A[API Gateway] --> B[Business Service]
    B --> C{API Type}
    C -->|Public| D[/businesses/*]
    C -->|Admin| E[/admin/businesses/*]
    C -->|Internal| F[/internal/businesses/*]

    D --> G[Public Controller]
    E --> H[Admin Controller]
    F --> I[Internal Controller]

    G --> J[Business Service]
    H --> J
    I --> J

    J --> K[Business Repository]
    K --> L[(PostgreSQL)]
    J --> M[Translation Client]
    J --> N[Cache Service]
```

## 🔌 API Reference

### Public API (`/businesses`)

```typescript
// Get all businesses with filters
GET /businesses
Query: {
  page?: number
  limit?: number
  categoryId?: string
  active?: boolean
  verified?: boolean
  search?: string
  sortBy?: 'createdAt' | 'avgRating' | 'businessName'
  sortOrder?: 'asc' | 'desc'
}

// Get business by ID
GET /businesses/:id
Params: { id: string }
Query: { include?: 'owner,category,vouchers' }

// Get current user's business
GET /businesses/my-business
Headers: { Authorization: 'Bearer <token>' }
```

### Admin API (`/admin/businesses`)

```typescript
// Admin: Get all businesses
GET /admin/businesses
Query: {
  page?: number
  limit?: number
  userId?: string
  categoryId?: string
  verified?: boolean
  active?: boolean
}

// Admin: Create business
POST /admin/businesses
Body: {
  userId: string
  businessName: string
  businessDescription?: string
  categoryId: string
  verified?: boolean
  active?: boolean
}

// Admin: Update business
PUT /admin/businesses/:id
Body: {
  businessName?: string
  businessDescription?: string
  categoryId?: string
  verified?: boolean
  active?: boolean
}

// Admin: Verify business
POST /admin/businesses/:id/verify

// Admin: Deactivate business
POST /admin/businesses/:id/deactivate

// Admin: Delete business
DELETE /admin/businesses/:id
```

### Internal API (`/internal/businesses`)

```typescript
// Internal: Get business by user ID
GET /internal/businesses/user/:userId
Headers: { 'x-api-key': '<service-key>' }

// Internal: Update business rating
PUT /internal/businesses/:id/rating
Body: { rating: number }

// Internal: Bulk operations
POST /internal/businesses/bulk
Body: {
  operation: 'verify' | 'deactivate'
  ids: string[]
}
```

## 💼 Business Model

### Domain Model

```typescript
interface BusinessDomain {
  // Identity
  id: string
  userId: string

  // Business Info (i18n)
  businessNameKey: string // Translation key
  businessDescriptionKey?: string // Translation key

  // Categorization
  categoryId: string
  category?: CategoryDomain

  // Status
  verified: boolean
  active: boolean

  // Metrics
  avgRating: number
  totalReviews?: number

  // Relations
  owner?: UserDomain
  vouchers?: VoucherDomain[]

  // Timestamps
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}
```

### Create/Update DTOs

```typescript
interface CreateBusinessDTO {
  userId: string
  businessName: string // Actual text (will be translated)
  businessDescription?: string // Actual text (will be translated)
  categoryId: string
  verified?: boolean
  active?: boolean
}

interface UpdateBusinessDTO {
  businessName?: string
  businessDescription?: string
  categoryId?: string
  verified?: boolean
  active?: boolean
}
```

## 🔧 Service Implementation

### Business Service

```typescript
export class BusinessService {
  constructor(
    private businessRepository: IBusinessRepository,
    private translationService: TranslationClient,
    private cacheService?: ICacheService
  )

  async createBusiness(data: CreateBusinessRequest): Promise<BusinessDomain> {
    // 1. Check for existing business
    const existing = await this.businessRepository.findByUserId(data.userId)
    if (existing) throw ErrorFactory.resourceConflict('Business', 'User already has a business')

    // 2. Generate translation keys
    const nameKey = `business.name.${uuid()}`
    const descKey = data.businessDescription ? `business.description.${uuid()}` : undefined

    // 3. Create translations
    await this.translationService.set(nameKey, DEFAULT_LANGUAGE, data.businessName)
    if (descKey && data.businessDescription) {
      await this.translationService.set(descKey, DEFAULT_LANGUAGE, data.businessDescription)
    }

    // 4. Create business
    return await this.businessRepository.create({
      userId: data.userId,
      businessNameKey: nameKey,
      businessDescriptionKey: descKey,
      categoryId: data.categoryId,
      verified: data.verified ?? false,
      active: data.active ?? true,
      avgRating: 0
    })
  }
}
```

### Repository Pattern

```typescript
export class BusinessRepository implements IBusinessRepository {
  constructor(
    private prisma: PrismaClient,
    private cache?: ICacheService
  )

  async findAll(params: BusinessSearchParams): Promise<PaginatedResult<BusinessDomain>> {
    const where = this.buildWhereClause(params)
    const orderBy = this.buildOrderBy(params.sortBy, params.sortOrder)

    const [data, total] = await Promise.all([
      this.prisma.business.findMany({
        where,
        orderBy,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        include: this.getIncludes(params.include)
      }),
      this.prisma.business.count({ where })
    ])

    return {
      data: data.map(BusinessMapper.fromDocument),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit)
      }
    }
  }
}
```

## 🌐 Internationalization

### Translation Key Management

```typescript
// Business names and descriptions use translation keys
const business = {
  businessNameKey: 'business.name.abc123',
  businessDescriptionKey: 'business.description.abc123',
}

// Translations stored separately
translations = {
  'business.name.abc123': {
    es: 'Mi Negocio',
    en: 'My Business',
    gn: 'Che Negocio',
  },
}

// Resolution in controllers
const translatedBusiness = await translationClient.resolveTranslations(business, request.language)
```

## 🔍 Search & Filtering

### Advanced Search Parameters

```typescript
interface BusinessSearchParams {
  // Pagination
  page: number
  limit: number

  // Filters
  categoryId?: string
  userId?: string
  active?: boolean
  verified?: boolean
  search?: string // Searches translation values

  // Sorting
  sortBy?: 'createdAt' | 'avgRating' | 'businessName'
  sortOrder?: 'asc' | 'desc'

  // Relations
  include?: ParsedIncludes
}

// Usage
const businesses = await businessService.getAllBusinesses({
  page: 1,
  limit: 20,
  categoryId: 'food-category-id',
  verified: true,
  active: true,
  sortBy: 'avgRating',
  sortOrder: 'desc',
  include: { owner: true, category: true },
})
```

## 🧪 Testing

### Integration Tests

```typescript
describe('Business API Integration', () => {
  let app: Express
  let testDb: TestDatabase
  let authToken: string

  beforeAll(async () => {
    testDb = await createTestDatabase()
    app = await createBusinessServer({
      prisma: testDb.prisma,
      cache: new MemoryCacheService(),
    })
    authToken = await getTestAuthToken()
  })

  describe('POST /businesses', () => {
    it('should create business with translations', async () => {
      const response = await request(app)
        .post('/admin/businesses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: 'test-user-id',
          businessName: 'Test Restaurant',
          businessDescription: 'Best food in town',
          categoryId: 'food-category-id',
        })
        .expect(201)

      expect(response.body).toMatchObject({
        userId: 'test-user-id',
        businessNameKey: expect.stringMatching(/^business\.name\./),
        categoryId: 'food-category-id',
        verified: false,
        active: true,
      })
    })
  })
})
```

### Unit Tests

```typescript
describe('BusinessService', () => {
  let service: BusinessService
  let mockRepo: MockBusinessRepository
  let mockTranslation: MockTranslationClient

  beforeEach(() => {
    mockRepo = new MockBusinessRepository()
    mockTranslation = new MockTranslationClient()
    service = new BusinessService(mockRepo, mockTranslation)
  })

  describe('verifyBusiness', () => {
    it('should update verification status', async () => {
      const businessId = 'test-business-id'
      mockRepo.findById.mockResolvedValue(mockBusiness)

      const result = await service.verifyBusiness(businessId)

      expect(mockRepo.update).toHaveBeenCalledWith(businessId, {
        verified: true,
      })
      expect(result.verified).toBe(true)
    })
  })
})
```

## 🔧 Configuration

### Environment Variables

```bash
# Service Configuration
BUSINESS_SERVICE_PORT=5511
BUSINESS_SERVICE_HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/pika

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379

# Translation Service
TRANSLATION_SERVICE_URL=http://localhost:5509

# Feature Flags
ENABLE_BUSINESS_CACHE=true
BUSINESS_CACHE_TTL=300

# Business Defaults
DEFAULT_BUSINESS_LIMIT=20
MAX_BUSINESS_LIMIT=100
```

## 📊 Monitoring & Metrics

### Business Metrics

```typescript
// Track business operations
metrics.increment('business.created', { category: categoryId })
metrics.increment('business.verified')
metrics.gauge('business.avg_rating', avgRating)

// Cache performance
metrics.increment('business.cache.hit')
metrics.increment('business.cache.miss')

// API latency
metrics.histogram('business.api.latency', {
  endpoint: '/businesses',
  method: 'GET',
})
```

### Health Checks

```typescript
GET /health
Response: {
  status: 'healthy',
  version: '1.0.0',
  uptime: 3600,
  checks: {
    database: 'healthy',
    cache: 'healthy',
    translation: 'healthy'
  }
}
```

## 🔒 Security

### Access Control

```typescript
// Public endpoints - JWT required
router.get('/businesses/my-business', authenticate(), controller.getMyBusiness)

// Admin endpoints - Admin role required
router.post('/admin/businesses', authenticate(), authorize('admin'), controller.create)

// Internal endpoints - Service API key required
router.put('/internal/businesses/:id/rating', authenticateService(), controller.updateRating)
```

### Data Validation

```typescript
// Zod schemas for validation
const createBusinessSchema = z.object({
  userId: z.string().uuid(),
  businessName: z.string().min(1).max(100),
  businessDescription: z.string().max(500).optional(),
  categoryId: z.string().uuid(),
  verified: z.boolean().optional(),
  active: z.boolean().optional(),
})
```

## 🚀 Performance Optimization

### Caching Strategy

```typescript
// Cache business by ID
const cacheKey = `business:${id}`
const cached = await cache.get(cacheKey)
if (cached) return cached

const business = await repository.findById(id)
await cache.set(cacheKey, business, 300) // 5 min TTL

// Cache invalidation
await cache.del(`business:${id}`)
await cache.del(`business:user:${userId}`)
```

### Query Optimization

```typescript
// Optimized includes
const includes = {
  owner: params.include?.owner ? {
    select: { id: true, email: true, profile: true }
  } : false,
  category: params.include?.category,
  _count: {
    select: { vouchers: true }
  }
}

// Indexed queries
@@index([userId])
@@index([categoryId, active, verified])
@@index([avgRating])
```

## 📝 Changelog

### Recent Updates

- Implemented Clean Architecture with proper separation
- Added translation key system for i18n support
- Created three-tier API structure (public/admin/internal)
- Added business verification workflow
- Implemented rating management system
- Added comprehensive caching layer
- Enhanced search and filtering capabilities

---

**Package Version**: 1.0.0  
**Last Updated**: 2025-01-27  
**Maintainer**: Platform Team
