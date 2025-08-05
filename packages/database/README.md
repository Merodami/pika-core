# 🗄️ @pika/database - Multi-Schema Database Architecture & Prisma ORM

![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.12.0-darkblue?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17.2-blue?logo=postgresql)
![Status](https://img.shields.io/badge/Status-Production-success)

## 🎯 Purpose & Vision

The Database package provides a **sophisticated multi-schema PostgreSQL architecture** with Prisma ORM integration. It implements domain-driven database design with logical schema separation, comprehensive audit trails, and support for geospatial operations, serving as the foundational data layer for the entire Pika platform.

## 🚀 Quick Start

```bash
# Install dependencies and generate Prisma client
yarn install

# Generate Prisma client from schema
yarn nx run @pika/database:prisma:generate

# Run migrations
yarn nx run @pika/database:prisma:migrate:dev

# Seed database with initial data
yarn nx run @pika/database:prisma:seed

# Open Prisma Studio for data exploration
yarn nx run @pika/database:prisma:studio
```

## 📋 Overview

The Database package is an enterprise-grade data management system that:

- **Manages Schema**: Multi-schema PostgreSQL architecture for domain separation
- **Handles Migrations**: Version-controlled database schema evolution
- **Provides ORM**: Type-safe database access through Prisma
- **Enables Extensions**: PostGIS for geospatial, pgcrypto for security
- **Seeds Data**: Automated initial data population
- **Tracks Changes**: Comprehensive audit logging
- **Optimizes Performance**: Strategic indexing and query optimization

### Key Features

- 🏗️ **Multi-Schema Architecture**: 13 logical schemas for domain separation
- 🌍 **Geospatial Support**: PostGIS integration for location-based features
- 🔐 **Security First**: pgcrypto for encryption, row-level security ready
- 📊 **Audit Everything**: Complete audit trail for compliance
- 🔄 **Migration Safety**: Reversible migrations with rollback support
- 🌐 **i18n Ready**: Translation tables for multi-language support
- ⚡ **Performance Optimized**: Strategic indexes and materialized views

## 🏗️ Architecture

### Multi-Schema Design

```sql
-- Domain-Driven Schema Organization
├── public/          -- Shared utilities and extensions
├── users/           -- User profiles and preferences
├── identity/        -- Authentication and authorization
├── audit/           -- Audit logs and compliance
├── support/         -- Help desk and ticketing
├── payments/        -- Financial transactions
├── files/           -- File storage metadata
├── i18n/            -- Internationalization
├── catalog/         -- Product/service catalog
├── marketplace/     -- Vouchers and redemptions
├── business/        -- Business entities
├── analytics/       -- Analytics and reporting
└── security/        -- Security and access control
```

### Schema Relationships

```mermaid
graph TB
    identity[Identity Schema] --> users[Users Schema]
    users --> audit[Audit Schema]
    business[Business Schema] --> catalog[Catalog Schema]
    marketplace[Marketplace Schema] --> business
    marketplace --> payments[Payments Schema]
    payments --> audit
    support[Support Schema] --> users
    files[Files Schema] --> users
    i18n[i18n Schema] --> catalog
    i18n --> marketplace
    analytics[Analytics Schema] --> marketplace
    security[Security Schema] --> identity
```

### Prisma Schema Structure

```
prisma/
├── base.prisma          # Generator and datasource config
├── enums.prisma        # All enum definitions
├── models/              # Model definitions by domain
│   ├── user.prisma      # User-related models
│   ├── auth.prisma      # Authentication models
│   ├── business.prisma  # Business entities
│   ├── voucher.prisma   # Voucher models
│   ├── payment.prisma   # Payment models
│   └── ...
├── schema.prisma        # Generated combined schema (DO NOT EDIT)
└── merge.ts            # Schema merge utility
```

## 🔌 Database Features

### PostgreSQL Extensions

```sql
-- Enabled Extensions
pgcrypto              -- Cryptographic functions
postgis               -- Geospatial data and queries
postgis_topology      -- Topology spatial types
fuzzystrmatch         -- Fuzzy string matching
postgis_tiger_geocoder -- Address geocoding
```

### Core Models

#### User Domain

```prisma
model User {
  id            String      @id @default(cuid())
  email         String      @unique
  firstName     String
  lastName      String
  role          UserRole
  status        UserStatus  @default(unconfirmed)

  // Relations
  profile       UserProfile?
  businesses    Business[]
  auditLogs     AuditLog[]

  // Timestamps
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@schema("users")
}
```

#### Business Domain

```prisma
model Business {
  id                  String   @id @default(cuid())
  businessNameKey     String   @unique // Translation key
  businessDescKey     String?  // Translation key
  categoryId          String
  ownerId             String

  // Geospatial
  location            Json?    // PostGIS Point
  serviceArea         Json?    // PostGIS Polygon

  // Relations
  category            Category @relation(...)
  owner               User     @relation(...)
  vouchers            Voucher[]

  @@index([categoryId])
  @@index([location], type: Gist)
  @@schema("business")
}
```

#### Voucher Domain

```prisma
model Voucher {
  id                  String         @id @default(cuid())
  businessId          String
  state               VoucherState

  // Multilingual
  titleKey            String         // Translation key
  descriptionKey      String         // Translation key
  termsKey            String         // Translation key

  // Discount
  discountType        DiscountType
  discountValue       Decimal

  // Validity
  validFrom           DateTime
  expiresAt           DateTime

  // Limits
  maxRedemptions      Int?
  maxPerUser          Int            @default(1)
  currentRedemptions  Int            @default(0)

  @@index([businessId, state])
  @@index([expiresAt])
  @@schema("marketplace")
}
```

### Translation System

```prisma
model Translation {
  id          String   @id @default(cuid())
  key         String   @unique
  languageId  String
  value       String   @db.Text

  // Metadata
  domain      String?  // business, voucher, category
  verified    Boolean  @default(false)

  @@unique([key, languageId])
  @@index([languageId])
  @@schema("i18n")
}
```

## 🧪 Testing Strategy

### Database Testing

```bash
# Unit tests for schema
yarn test:schema

# Integration tests with test database
yarn test:integration

# Performance benchmarks
yarn test:performance
```

### Test Database Management

```typescript
// Automatic test database creation
import { createTestDatabase } from '@pika/tests'

const testDb = await createTestDatabase()
// Isolated database for each test suite
```

## 🔧 Configuration

### Environment Variables

```bash
# Database Connection
DATABASE_URL=postgresql://user:pass@localhost:5432/pika
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=5000

# PostgreSQL Settings
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=pika
PG_USER=postgres
PG_PASSWORD=postgres
PG_SSL=false

# Schema Configuration
DEFAULT_SCHEMA=public
ENABLE_ROW_SECURITY=true

# Migration Settings
SHADOW_DATABASE_URL=postgresql://user:pass@localhost:5432/pika_shadow
MIGRATION_LOCK_TIMEOUT=10000

# Performance
STATEMENT_TIMEOUT=30000
IDLE_TIMEOUT=10000
```

### Prisma Configuration

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema", "postgresqlExtensions"]
  output          = "../../../node_modules/.prisma/client"
  binaryTargets   = ["native", "rhel-openssl-3.0.x"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgcrypto, postgis, ...]
  schemas    = ["public", "users", ...]
}
```

## 🔄 Migration Management

### Creating Migrations

```bash
# Create a new migration
yarn prisma migrate dev --name add_user_preferences

# Apply migrations
yarn prisma migrate deploy

# Reset database (CAUTION: Destructive)
yarn prisma migrate reset
```

### Migration Best Practices

1. **Atomic Migrations**: One logical change per migration
2. **Backward Compatible**: Support rollbacks
3. **Index Strategy**: Create indexes concurrently
4. **Data Migrations**: Separate from schema migrations
5. **Testing**: Test migrations on copy of production

### Migration Example

```sql
-- Migration: Add user preferences
BEGIN;

-- Add table in users schema
CREATE TABLE users.user_preferences (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users.users(id),
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(5) DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index
CREATE INDEX idx_user_preferences_user_id
  ON users.user_preferences(user_id);

-- Add RLS policy
ALTER TABLE users.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_preferences_policy ON users.user_preferences
  FOR ALL TO application_role
  USING (user_id = current_setting('app.user_id')::TEXT);

COMMIT;
```

## 📊 Performance Optimization

### Indexing Strategy

```prisma
// Composite indexes for common queries
@@index([businessId, state, expiresAt])

// Partial indexes for specific conditions
@@index([state], where: "state = 'published'")

// GiST indexes for geospatial
@@index([location], type: Gist)

// GIN indexes for full-text search
@@index([searchVector], type: Gin)
```

### Query Optimization

```typescript
// Use select to limit fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    profile: {
      select: { firstName: true, lastName: true },
    },
  },
})

// Use pagination
const results = await prisma.voucher.findMany({
  take: 20,
  skip: page * 20,
  orderBy: { createdAt: 'desc' },
})

// Use raw SQL for complex queries
const nearbyVouchers = await prisma.$queryRaw`
  SELECT * FROM marketplace.vouchers
  WHERE ST_DWithin(location, ST_MakePoint(${lng}, ${lat}), ${radius})
  AND state = 'published'
  ORDER BY ST_Distance(location, ST_MakePoint(${lng}, ${lat}))
  LIMIT 20
`
```

## 🔒 Security Considerations

### Row Level Security (RLS)

```sql
-- Enable RLS on sensitive tables
ALTER TABLE users.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY users_isolation ON users.users
  FOR ALL
  USING (id = current_setting('app.user_id')::TEXT);
```

### Data Encryption

```sql
-- Use pgcrypto for sensitive data
INSERT INTO users.users (email, password_hash)
VALUES (
  'user@example.com',
  crypt('password123', gen_salt('bf'))
);

-- Verify password
SELECT * FROM users.users
WHERE email = 'user@example.com'
  AND password_hash = crypt('password123', password_hash);
```

### Audit Logging

```prisma
model AuditLog {
  id          String      @id @default(cuid())
  userId      String?
  action      AuditAction
  tableName   String
  recordId    String
  changes     Json?
  ipAddress   String?
  userAgent   String?
  timestamp   DateTime    @default(now())

  @@index([userId, timestamp])
  @@index([tableName, recordId])
  @@schema("audit")
}
```

## 🚨 Error Handling

### Database Error Codes

| Code  | Description                 | Handling               |
| ----- | --------------------------- | ---------------------- |
| P2002 | Unique constraint violation | Return 409 Conflict    |
| P2003 | Foreign key violation       | Return 400 Bad Request |
| P2025 | Record not found            | Return 404 Not Found   |
| P2021 | Table does not exist        | Check migrations       |
| P1001 | Connection error            | Retry with backoff     |

### Error Handling Pattern

```typescript
try {
  await prisma.user.create({ data })
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new ConflictError('User already exists')
    }
  }
  throw error
}
```

## 📈 Future Roadmap

### Planned Enhancements

- [ ] **Partitioning**: Time-based partitioning for large tables
- [ ] **Read Replicas**: Automatic read/write splitting
- [ ] **Connection Pooling**: PgBouncer integration
- [ ] **Materialized Views**: Pre-computed analytics
- [ ] **Full-Text Search**: PostgreSQL FTS integration
- [ ] **Event Sourcing**: Audit log as event store
- [ ] **Data Archival**: Automated old data archival
- [ ] **Schema Versioning**: Blue-green deployments
- [ ] **Performance Monitoring**: Query performance tracking
- [ ] **Automated Backups**: Point-in-time recovery

## 🤝 Contributing

### Schema Development

1. **Modify Source Files**: Edit files in `prisma/models/`
2. **Never Edit schema.prisma**: It's auto-generated
3. **Run Merge Script**: `yarn prisma:merge`
4. **Generate Migration**: `yarn prisma migrate dev`
5. **Test Migration**: Apply to test database
6. **Update Seed Data**: If needed

### Best Practices

- One model per file in `models/`
- Group related enums in `enums.prisma`
- Document complex relationships
- Add appropriate indexes
- Consider query patterns

## 📝 Changelog

### Recent Changes

- Added multi-schema architecture
- Implemented translation system
- Added PostGIS for geospatial
- Enhanced audit logging
- Optimized indexes

### Migration History

- v1.0: Initial single-schema design
- v2.0: Multi-schema architecture
- v2.1: PostGIS integration
- v2.2: Translation system
- v2.3: Enhanced security

---

**Package Version**: 2.3.0  
**Last Updated**: 2025-01-27  
**Maintainer**: Platform Team
