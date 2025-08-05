# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL: PROJECT MIGRATION IN PROGRESS

**IMPORTANT CONTEXT**: This project is undergoing a major architectural migration from the old "Pika" codebase (located in `/pika` folder) to a new modern microservices architecture (formerly called "Solo60", now renamed to "Pika"). All references to "Solo60" have been renamed to "Pika" throughout the codebase.

### Migration Context

- **Old Project**: Original Pika codebase in `/pika-old` folder - legacy architecture
- **New Project**: Modern microservices architecture (this codebase) - formerly Solo60, now Pika
- **Status**: Active migration in progress - build/test commands may be broken due to renaming

### Why This Migration

- **Better Architecture**: Clean Architecture with proper separation of concerns (Controller → Service → Repository)
- **Improved API Structure**: Proper separation between public, admin, and internal APIs
- **Modern Infrastructure**: Working API Gateway on Vercel, better service communication patterns
- **Superior Technology Choices**: Zod over Typebox, better storage service, integrated mailing system
- **Firebase Ready**: Architecture prepared for future Firebase integration

### Migration Strategy

- Follow the new project's Clean Architecture patterns for all migrated services
- Consolidate related services where appropriate (e.g., voucher + redemptions)
- Keep infrastructure and core services from new architecture
- Remove domain-specific services (gym, session, social) and rebuild as needed
- Maintain proper API separation (public/admin/internal)

### During Migration

- **DO NOT** run build/test commands - they are temporarily broken due to renaming
- **DO** analyze both architectures before making changes
- **DO** follow patterns from the new architecture when migrating services
- **DO** consolidate services where it makes architectural sense

## TOP PRIORITY INSTRUCTIONS

### Pattern Following

**When the user asks to follow an exact pattern from specific code content, you MUST follow that exact pattern and adapt it for the case.** Do not deviate from the pattern shown, preserve all structural elements, naming conventions, and implementation details while only changing what is necessary for the specific use case.

## Project Overview

A modern microservices platform built with Node.js, TypeScript, and Express, following clean architecture principles.

### Core Architecture

- **Architecture Pattern**: Clean Architecture with simplified microservices (Controller → Service → Repository)
- **Monorepo Management**: NX 21.1.3 with Yarn 4.9.1 workspaces
- **Runtime**: Node.js 22.x with ESM modules
- **Language**: TypeScript 5.8.3 with strict configuration

## Technology Stack

- **Backend Framework**: Express 4.x (mature and stable HTTP server)
- **Database**: PostgreSQL with Prisma 6.9.0 ORM
- **Caching**: Redis with ioredis 5.6.1 client
- **Validation**: Zod schemas with type inference
- **Authentication**: JWT tokens, bcrypt
- **Testing**: Vitest 3.2.2, Testcontainers 11.0.1, Supertest 7.1.1
- **Infrastructure**: Docker Compose
- **Code Quality**: ESLint 9.28.0, Prettier 3.5.3, TypeScript 5.8.3
- **Build Tools**: esbuild 0.25.5, tsc-alias, NX orchestration
- **Monitoring**: Health checks, metrics endpoints, Pino 9.7.0 logging

### Development Environment

- **Package Manager**: Yarn 4.9.1 (Berry/Modern Yarn) with workspaces
- **Module System**: ESM (type: "module") across all packages
- **Path Resolution**: tsc-alias, vite-tsconfig-paths for import mapping
- **Hot Reload**: tsx 4.19.4 for TypeScript execution
- **Process Management**: concurrently, fkill-cli for service orchestration
- **Pre-commit**: Husky with lint-staged for quality gates
- **Dependency Analysis**: knip for unused dependencies, depcheck configuration

### Environment Configuration

- Development settings in `.env` file
- **Service Ports**: Each service has a dedicated port (5020+)
- **Infrastructure Ports**:
  - PostgreSQL: 5435
  - Redis: 6380
  - API Gateway: 5500

## Essential Commands

### Development Workflow

```bash
# Initial setup
yarn install
yarn docker:local           # Start PostgreSQL, Redis
yarn local:generate         # Generate Prisma client, run migrations, seed database

# Development
yarn local                  # Start all services in watch mode
yarn kill                   # Kill all running backend services

# Service-specific development
yarn nx run @pika/[service-name]:local
```

### Building & Testing

```bash
# Build & validation
yarn build                  # Build all packages using NX orchestration
yarn nx run {package}:build # Build specific package from root folder (e.g., api:build)
yarn typecheck             # Run TypeScript type checking
yarn lint                  # Run ESLint and Prettier checks
yarn lint:fix              # Fix linting issues automatically

# Testing
yarn test                  # Run all tests with Vitest
yarn test:integration      # Run integration tests only
vitest [path]              # Run specific test file

# Database operations
yarn db:migrate            # Run Prisma database migrations
yarn db:seed               # Seed database with sample data
yarn db:generate           # Generate Prisma client after schema changes

# Code generation
yarn generate:api          # Generate OpenAPI specification
yarn generate:sdk          # Generate SDK from OpenAPI spec
```

## Architecture Guidelines

### Simplified Microservice Structure

Each service follows this structure:

```
packages/services/[service-name]/
├── src/
│   ├── controllers/       # HTTP request handlers
│   ├── services/          # Business logic layer
│   ├── repositories/      # Data access layer
│   ├── routes/            # Route definitions
│   ├── models/            # Domain models
│   ├── dtos/              # Data transfer objects
│   ├── middleware/        # Service-specific middleware
│   ├── utils/             # Utility functions
│   ├── app.ts            # Service initialization
│   ├── server.ts         # Server configuration
│   └── index.ts          # Entry point
```

### Package Organization

- **Core Packages**: `@pika/shared`, `@pika/types`, `@pika/environment`
- **Infrastructure**: `@pika/database`, `@pika/redis`
- **Framework**: `@pika/http`, `@pika/auth`, `@pika/api-gateway`
- **API Contract**: `@pika/api` - OpenAPI schemas and types
- **SDK**: `@pika/sdk` - Shared mappers and domain logic
- **Testing**: `@pika/tests` with shared fixtures and utilities
- **Services**:
  - `@pika/category-service` - Category management (COMPLETED)
  - `@pika/business-service` - Business management (COMPLETED - migrated from Provider)

### Frontend SDK Architecture

This architecture ensures:

- **Contract-First Development**: OpenAPI spec drives both backend and frontend types
- **Type Consistency**: Single source of truth for API contracts
- **Independent Deployment**: Frontend and backend can be deployed separately
- **Developer Experience**: Frontend developers get autocomplete and type checking

### Import Guidelines

#### Core Import Requirements

- **ESM Modules**: All packages use `"type": "module"` in package.json
- **File Extensions**: TypeScript files **MUST** use `.js` extension in imports (ESM requirement)
- **Path Aliases**: Extensive tsconfig.json path mappings for clean imports
- **Build Transformation**: `tsc-alias` converts path aliases to relative paths in compiled output

#### Import Pattern Categories

**1. External Package Imports**

```typescript
// Third-party packages - direct imports
import { type Request, type Response } from 'express'
import { PrismaClient } from '@prisma/client'
```

**2. Cross-Package Imports (Preferred)**

```typescript
// Use @pika/ prefixed aliases for cross-package imports
import { schemas } from '@pika/api'
import { ErrorFactory, logger } from '@pika/shared'
import { DEFAULT_LANGUAGE } from '@pika/environment'
import { createExpressServer } from '@pika/http'
```

**2.1. Inter-Service Communication**

```typescript
// Service clients are imported from @pika/shared
import { CommunicationServiceClient, PaymentServiceClient, UserServiceClient, BusinessServiceClient, CategoryServiceClient } from '@pika/shared'
```

**3. Service-Specific Imports**

```typescript
// Use relative imports within services
import { CategoryService } from './services/CategoryService.js'
import { CategoryRepository } from './repositories/CategoryRepository.js'
```

**4. Type-Only Imports**

```typescript
// Use 'type' keyword for type-only imports (performance optimization)
import { type Request, type Response } from 'express'
import type { CategoryDomain } from '@pika/sdk'
```

#### Critical Import Rules

1. **ALWAYS use `.js` extensions** in TypeScript imports for ESM compatibility
2. **Prefer @pika/ aliases** for cross-package imports over relative paths
3. **Use `type` keyword** for type-only imports to optimize bundle size
4. **Check package existence** before importing - verify in package.json dependencies
5. **Follow workspace pattern** - use workspace:^ for internal package versions
6. **Important**: Use `@pika/types` for core type definitions

## Architectural Patterns

### Repository Pattern

```typescript
export interface ICategoryRepository {
  findAll(params: SearchParams): Promise<PaginatedResult<Category>>
  findById(id: string): Promise<Category | null>
  create(data: CreateInput): Promise<Category>
  update(id: string, data: UpdateInput): Promise<Category>
  delete(id: string): Promise<void>
}

export class CategoryRepository implements ICategoryRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}
  // Implementation details
}
```

### Service Layer Pattern

```typescript
export class CategoryService {
  constructor(
    private readonly repository: ICategoryRepository,
    private readonly cache: ICacheService,
  ) {}

  async getAllCategories(params: SearchParams): Promise<PaginatedResult<Category>> {
    // Business logic, validation, caching
  }
}
```

### Controller Pattern

```typescript
export class CategoryController {
  constructor(private readonly categoryService: ICategoryService) {
    // Bind methods to preserve 'this' context
    this.getAllCategories = this.getAllCategories.bind(this)
  }

  @Cache({ ttl: 3600, prefix: 'categories' })
  async getAllCategories(request: Request) {
    // Extract params, call service, return response
    const result = await this.categoryService.getAllCategories(params)
    return result // Return values, don't use res.send()
  }
}
```

### Dependency Injection Pattern

Manual dependency injection without a DI container:

```typescript
// In routes file
import { Router } from 'express'

export function createCategoryRouter(prisma: PrismaClient, cache: ICacheService): Router {
  const router = Router()
  const repository = new CategoryRepository(prisma, cache)
  const service = new CategoryService(repository, cache)
  const controller = new CategoryController(service)

  // Register routes
  router.get('/', controller.getAllCategories)

  return router
}
```

## Schema Organization Standard (CRITICAL)

**ALL services MUST follow the standardized schema organization pattern.** Reference implementation: Category service.

📖 **Full Documentation**: `docs/new-architecture/SCHEMA_ORGANIZATION_PATTERN.md`

### Key Rules:

- **Path Parameters**: Import from `@pika/api/common` (e.g., `CategoryIdParam`)
- **File Names**: `public/[feature].ts`, `admin/management.ts`, `internal/service.ts`
- **No Cross-Tier Imports**: Public ≠ Admin ≠ Internal
- **Use openapi()**: All schemas wrapped with `openapi()` helper

### Perfect Template: Category Service

```
/packages/api/src/schemas/category/
├── public/category.ts      # Customer-facing schemas
├── admin/management.ts     # Admin panel operations
├── internal/service.ts     # Service-to-service communication
├── common/enums.ts         # Service-specific enums
└── index.ts               # Export all tiers
```

## Data Transformation: Mapper Pattern (REQUIRED)

**When creating new services, you MUST implement mappers** for proper data transformation between layers:

- **Type safety** across different representations
- **Date formatting** and validation

### Mapper Structure

```typescript
export class EntityMapper {
  // Database → Domain: Convert database documents to domain entities
  static fromDocument(doc: EntityDocument): EntityDomain {}

  // Domain → API: Convert domain entities to API DTOs
  static toDTO(domain: EntityDomain): EntityDTO {}

  // API → Domain: Convert API DTOs to domain entities
  static fromDTO(dto: EntityDTO): EntityDomain {}
}
```

### Critical Architectural Principle: Infrastructure Isolation

**NEVER import Prisma types in mappers!** This violates Clean Architecture.

✅ **Correct Pattern**:

```typescript
// Repository layer handles Prisma conversion
const vouchers = await this.prisma.voucher.findMany()
// Convert Prisma result to generic document interface
const documents = vouchers.map((v) => ({ ...v, state: v.state as string }))
return documents.map(VoucherMapper.fromDocument)
```

❌ **Wrong Pattern**:

```typescript
// NEVER do this in mappers!
import { VoucherState as PrismaVoucherState } from '@prisma/client' // ❌
```

**Rule**: Mappers work with whatever the repository provides. Use generic string/primitive types in document interfaces, not infrastructure-specific types. The repository layer is responsible for converting infrastructure types to domain-compatible types.

### Usage in Controllers

Controllers must use mappers for all data transformations:

```typescript
async getAll(request: Request) {
  // 1. Execute service (gets domain entities)
  const result = await this.service.getAll(params)

  // 2. Convert domain to DTOs using mapper
  const dtoResult = {
    data: result.data.map((entity) => EntityMapper.toDTO(entity)),
    pagination: result.pagination,
  }

  return dtoResult
}
```

## System Patterns

### System-Wide Idempotency Pattern

Centralized idempotency middleware prevents duplicate processing:

```typescript
const app = await createExpressServer({
  serviceName: 'service-name',
  cacheService,
  idempotencyOptions: {
    enabled: true,
    defaultTTL: 86400, // 24 hours
    methods: ['POST', 'PUT', 'PATCH'],
    excludeRoutes: ['/health', '/metrics'],
  },
})
```

### Caching System

Two-tier caching strategy:

1. **Redis Cache Service**: Central caching via `ICacheService`
2. **Method-Level Caching**: `@Cache()` decorator for controller methods

```typescript
@Cache({
  ttl: 3600,
  prefix: 'categories',
  keyGenerator: httpRequestKeyGenerator,
})
async getAllCategories(request: Request) {
  return this.service.getAllCategories(params)
}
```

### Error Handling

- Use `ErrorFactory` for creating standardized errors
- Include correlation IDs for request tracing
- Proper error classification and context enrichment

```typescript
try {
  // Business logic
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    throw ErrorFactory.databaseError('operation', 'Failed', error)
  }
  throw ErrorFactory.fromError(error)
}
```

## Testing Strategy

### Testing Patterns

```typescript
// Integration test setup
const testDb = await createTestDatabase()
const app = await createCategoryServer({
  prisma: testDb.prisma,
  cacheService: new MemoryCacheService(),
})

// Test with real implementations
const response = await supertest(app.server).get('/categories').set('Authorization', `Bearer ${token}`).expect(200)
```

### Testing Best Practices

1. **Use Real Services**: Don't mock external dependencies unnecessarily
2. **Seed with Test Data**: Use consistent test data with proper relationships
3. **Test Error Paths**: Ensure error codes match expected behavior
4. **Isolate Test Data**: Clear database between tests

### Database Seeding Strategy

The platform uses comprehensive seeding for realistic testing:

1. **Session Distribution**: Each user gets 20-200 sessions for realistic history
2. **Performance Fields**: Sessions include denormalized `gymName` and `trainerName`
3. **Even Distribution**: Algorithm ensures all users have session history
4. **Realistic Data**: Various session states, dates, and relationships

```bash
yarn db:seed  # Creates ~11,000 sessions for 98 users
              # Average: ~112 sessions per user
```

## Development Guidelines

### Prisma Schema Management

**IMPORTANT**: Never modify `packages/database/prisma/schema.prisma` directly as it is a compiled output!

Instead, modify the source schema files:

- `packages/database/prisma/base.prisma` - Base configuration
- `packages/database/prisma/enums.prisma` - Enum definitions
- `packages/database/prisma/models/*.prisma` - Individual model files

After making changes to source files, run:

```bash
yarn db:generate  # Generates the compiled schema.prisma and Prisma client
```

### Before Making Changes

1. Read context files: `package.json`, `nx.json`, `.env`
2. Analyze related files in the same directory
3. Check imports and ensure packages exist before using them
4. Run `yarn lint` and `yarn typecheck` after changes
5. Use `.env`, `.env.local` and `.env.test` for environment variables

### Service Development

- Follow the simplified microservice structure (Controller → Service → Repository)
- Use manual dependency injection pattern
- **Create mappers for data transformation**
- Include comprehensive integration tests
- Document API endpoints with OpenAPI specifications

### Type Organization

- **Service-Specific Types**: `packages/services/[service]/src/types/` - Service-only enums, interfaces, constants
- **Shared Application Types**: `packages/types/src/` - Cross-service enums, interfaces, shared business types
- **Global Variables**: `packages/environment/src/` - Environment variables, Redis config, API URLs, global constants
- **SDK Types**: `packages/sdk/src/` - Domain objects, DTOs, mappers for data transformation
- **Rule**: Use `@pika/environment` for all global variables (Redis, Stripe, pagination, etc.). Never duplicate in service types.

### Important Notes

- **Mapper Pattern**: All services MUST implement mappers for data transformation
- **ESM First**: All packages use ESM modules with `.js` extensions in imports
- **Type Safety**: Strict TypeScript configuration, use `export type` for type-only exports
- **Clean Architecture**: Controllers → Services → Repositories → Database
- **Dependency Injection**: Constructor injection for testability
- **Error Boundaries**: Comprehensive error handling with correlation IDs
- **Caching Strategy**: Redis integration at service and controller levels

### Controller Pattern (Standard)

Controllers follow the traditional Express pattern with proper error handling:

```typescript
// CORRECT - Traditional Express pattern
async getAll(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = {
      page: request.query.page ? parseInt(request.query.page as string) : 1,
      // ... extract other params
    }

    const result = await this.service.getAll(params)

    // Transform to DTOs using mapper
    const dtoResult = {
      data: result.data.map(EntityMapper.toDTO),
      pagination: result.pagination,
    }

    response.json(dtoResult)
  } catch (error) {
    next(error)
  }
}

// Method binding in constructor
constructor(private readonly service: IService) {
  this.getAll = this.getAll.bind(this)
  // ... bind other methods
}
```

### Clean Architecture Reminders

**NEVER put database queries in Controllers!** This violates clean architecture principles.

- **Controllers**: Handle HTTP concerns only (extract params, call service)
- **Services**: Business logic, validation, orchestration
- **Repositories**: Data access and persistence
- **Mappers**: Data transformation between layers

### Layer Type Boundaries (CRITICAL)

**NEVER import API types directly into Service or Repository layers!** This violates Clean Architecture.

✅ **Correct Pattern**:

```typescript
// Controller (boundary layer)
import type { APISearchParams } from '@pika/api/public'
import type { ServiceSearchParams } from '../repositories/Repository.js'

// Transform at boundary using mappers
const serviceParams = EntityMapper.fromSearchParams(request.query)
const result = await this.service.method(serviceParams)
```

❌ **Wrong Pattern**:

```typescript
// Service layer - NEVER do this!
import type { APISearchParams } from '@pika/api/public' // ❌ Breaks Clean Architecture
```

**Rule**: API types stay in Controllers. Service/Repository layers use internal domain types. Controllers act as translators using established DTO mappers.

### Mapper Import Rules (CRITICAL)

**NEVER import from @pika/api in Mapper classes!** Mappers should only use Prisma types and internal domain types.

✅ **Correct Mapper Pattern**:

```typescript
// Mapper file - uses only Prisma types and internal DTOs
import type { VoucherBook, VoucherBookStatus } from '@prisma/client'

export class VoucherBookMapper {
  static canBeEdited(status: VoucherBookStatus): boolean {
    // Use Prisma enum values directly (lowercase)
    return status === 'draft'
  }
}
```

❌ **Wrong Mapper Pattern**:

```typescript
// Mapper file - NEVER do this!
import { VoucherBookStatus } from '@pika/api/shared' // ❌ Breaks architecture
```

**Rule**: Mappers work with database entities and domain objects only. They should never know about API schemas or Zod validation.

### Session Service Architecture (IMPORTANT)

The Session Service uses denormalized data for performance optimization:

```typescript
// Denormalized fields stored directly in sessions table
interface Session {
  gymName?: string // Avoid joining with gyms table
  trainerName?: string // Avoid joining with users table
}
```

**Implementation Pattern**:

```typescript
// Service fetches related data and stores denormalized
const gym = await this.gymServiceClient.getGym(data.gymId)
const sessionData = {
  ...data,
  gymName: gym.name, // Store for performance
}
```

**Benefits**: Faster queries, no joins needed, better filtering/sorting performance

### Request Type Safety (CRITICAL)

**NEVER use type assertions or `unknown` casts for Request objects!** Use proper typed Request parameters.

✅ **Correct Pattern**:

```typescript
// Use proper API schema types in Request generics
async method(
  request: Request<{}, {}, {}, APIQuerySchema>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const { param } = request.query // Fully typed
}
```

❌ **Wrong Pattern**:

```typescript
// NEVER do this - defeats type safety purpose
const data = request.query as unknown as APISchema // ❌
const data = request.query as APISchema // ❌
```

**Rule**: Always use `Request<Params, {}, Body, Query>` with proper API schema types. The validation middleware ensures runtime safety, TypeScript provides compile-time safety.

### Legacy Code

The `previous-architecture` directory contains legacy code and is completely excluded from all build processes, tests, and tooling. It's maintained solely for historical reference.

## Intra-Service Communication

The platform uses a standardized HTTP-based communication pattern between microservices. Service clients inherit from `BaseServiceClient` which provides retry logic, automatic error transformation, and service authentication via API keys. Each service has a dedicated client class (e.g., `UserServiceClient`, `PaymentServiceClient`) that encapsulates service-specific endpoints. Authentication is handled through `x-api-key` headers for service-to-service calls, with middleware to validate these on internal endpoints. Service discovery is static, using environment-configured URLs rather than dynamic discovery. All inter-service requests include correlation IDs and service identification headers for distributed tracing and debugging.

## Webhook Architecture (Modern Industry Standard)

### Stripe Webhook Implementation Pattern

Modern webhook implementations require **raw body parsing** for signature verification. The platform implements the industry-standard conditional body parsing pattern.

#### Implementation Pattern:

**1. HTTP Package - Conditional Body Parsing:**

```typescript
// Modern pattern: Skip JSON parsing for webhook routes
app.use((req, res, next) => {
  if (req.path.includes('/webhooks/') || req.path.includes('/webhook/')) {
    return next() // Skip JSON parsing
  }
  express.json()(req, res, next)
})
```

**2. Webhook Route - Raw Body Handler:**

```typescript
// Use express.raw() for signature verification
router.post('/stripe', express.raw({ type: 'application/json' }), webhookController.handleStripeWebhook)
```

**3. Authentication Exclusion:**

```typescript
authOptions: {
  excludePaths: [
    '/webhooks/*', // Webhooks use signature verification, not JWT
  ],
}
```

#### Architecture Design:

- **Payment Service**: Receives Stripe webhooks, validates signatures, triggers business logic
- **Subscription Service**: Manages subscription state based on webhook events
- **Service Communication**: Webhooks trigger cross-service calls via service clients
- **Idempotency**: Webhook handlers must be idempotent (Stripe may retry)
- **Error Handling**: Return 2xx status quickly to prevent Stripe retries

#### Security Best Practices:

- **Signature Verification**: Always verify `stripe-signature` header with webhook secret
- **Timing Attacks**: Use constant-time comparison for signature validation
- **Event Replay**: Check event timestamps to prevent replay attacks
- **Error Disclosure**: Don't expose internal errors in webhook responses

## Task Management

When encountering TODO comments or incomplete implementations in the codebase, these should be documented in the `ToDo.md` file at the project root for tracking and future resolution. This ensures technical debt is visible and can be systematically addressed rather than being lost in code comments.

## API Documentation Modification Steps

When adding new API endpoints, they must be properly included in the API documentation generation process:

### 1. Schema Registration

- Add schema imports to `/packages/api/src/scripts/generators/admin-api.ts` (for admin endpoints) or the appropriate generator file
- Register all schemas using `registry.registerSchema(name, schema)` in the `registerAdminAPI` function

### 2. Route Registration

- Add route registration using `registry.registerRoute()` in the `registerAdminRoutes` function
- Include proper OpenAPI spec with method, path, summary, tags, security, request/response schemas

### 3. Schema Export Structure

- Ensure schemas are exported from `/packages/api/src/admin/schemas/[service]/index.ts`
- Verify the service index exports are included in `/packages/api/src/admin/index.ts`

### 4. Generation Commands

- Run `yarn generate:api` to generate OpenAPI specification
- Run `yarn generate:sdk` to generate SDK with updated types
- Both commands should be run after schema/route changes

### 5. Verification

- Check that new endpoints appear in the generated API documentation
- Verify SDK includes new types and can be imported correctly
- Test that the endpoint works as documented

**Example Pattern:**

```typescript
// 1. Import schemas
import * as adminSessionBookingStatsSchemas from '../../admin/schemas/session/bookingStats.js'

// 2. Register schemas
registry.registerSchema('GetUserBookingStatsRequest', adminSessionBookingStatsSchemas.GetUserBookingStatsRequest)
registry.registerSchema('GetUserBookingStatsResponse', adminSessionBookingStatsSchemas.GetUserBookingStatsResponse)

// 3. Register route
registry.registerRoute({
  method: 'post',
  path: '/sessions/admin/sessions/stats/bookings',
  summary: 'Get booking statistics for multiple users',
  tags: ['Session Management'],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: adminSessionBookingStatsSchemas.GetUserBookingStatsRequest } } } },
  responses: { 200: { description: 'User booking statistics', content: { 'application/json': { schema: adminSessionBookingStatsSchemas.GetUserBookingStatsResponse } } } },
})
```
