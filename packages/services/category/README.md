# 📂 @pika/category-service - Hierarchical Category Management

![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?logo=typescript)
![Architecture](https://img.shields.io/badge/Architecture-Clean-green)
![Cache](https://img.shields.io/badge/Cache-Redis-red?logo=redis)
![Status](https://img.shields.io/badge/Status-Production-success)

## 🎯 Purpose & Vision

The Category Service is the **hierarchical taxonomy system** for the Pika platform. It manages business categories with support for nested hierarchies, path traversal, and intelligent caching. The service enables businesses to be organized into a flexible, multi-level category structure while providing high-performance queries for navigation and filtering across the platform.

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Run database migrations
yarn prisma:migrate

# Start development server
yarn nx run @pika/category:local

# Run tests
yarn nx run @pika/category:test

# Build for production
yarn nx run @pika/category:build
```

## 📋 Overview

The Category Service is a sophisticated categorization system that:

- **Manages Hierarchies**: Multi-level category trees with parent-child relationships
- **Provides Navigation**: Path traversal and breadcrumb generation
- **Enables Search**: Category filtering with pagination
- **Supports i18n**: Translation keys for category names/descriptions
- **Implements Caching**: Redis-backed performance optimization
- **Handles Sorting**: Custom sort orders within levels
- **Maintains Integrity**: Circular reference prevention
- **Tracks Status**: Active/inactive category states

### Key Features

- 🌳 **Hierarchical Structure**: Unlimited nesting levels
- 🔍 **Path Traversal**: Get full category paths
- 📊 **Bulk Operations**: Process multiple categories
- 🚀 **Performance**: Aggressive caching strategies
- 🌐 **Internationalization**: Multi-language support
- 🔄 **Status Management**: Toggle active/inactive
- 📏 **Sort Control**: Custom ordering within levels
- 🛡️ **Data Integrity**: Validation and constraints

## 🏗️ Architecture

### Clean Architecture Layers

```
src/
├── controllers/              # HTTP Request Handlers
│   ├── CategoryController.ts # Public API endpoints
│   └── AdminCategoryController.ts # Admin operations
├── services/                 # Business Logic Layer
│   └── CategoryService.ts    # Core category operations
├── repositories/             # Data Access Layer
│   └── CategoryRepository.ts # Database operations
├── routes/                   # Route Definitions
│   ├── categoryRoutes.ts     # Public routes
│   └── adminRoutes.ts        # Admin routes
├── types/                    # Type Definitions
│   └── interfaces.ts         # Shared interfaces
├── middleware/               # Custom Middleware
│   └── validation.ts         # Request validation
├── test/                     # Test Suite
│   ├── unit/                # Unit tests
│   └── integration/         # Integration tests
├── app.ts                   # Application setup
├── server.ts                # Server configuration
└── index.ts                 # Service entry point
```

### Category Hierarchy

```mermaid
graph TD
    A[Root Categories] --> B[Food & Dining]
    A --> C[Health & Wellness]
    A --> D[Retail]

    B --> E[Restaurants]
    B --> F[Cafes]
    B --> G[Fast Food]

    C --> H[Gyms]
    C --> I[Spas]
    C --> J[Medical]

    E --> K[Italian]
    E --> L[Mexican]
    E --> M[Asian]
```

## 🔌 API Reference

### Public API (`/categories`)

```typescript
// Get all categories with filters
GET /categories
Query: {
  page?: number          // Default: 1
  limit?: number         // Default: 20, Max: 100
  parentId?: string      // Filter by parent
  isActive?: boolean     // Filter by status
  search?: string        // Search in names
  sortBy?: 'name' | 'sortOrder' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

// Get category by ID
GET /categories/:id
Response: {
  id: string
  nameKey: string
  descriptionKey?: string
  icon?: string
  parentId?: string
  isActive: boolean
  sortOrder: number
  slug: string
  level: number
  path: string
  parent?: Category
  children?: Category[]
}

// Get categories by IDs (bulk)
POST /categories/bulk
Body: {
  ids: string[]
}

// Get category hierarchy
GET /categories/hierarchy
Query: {
  rootId?: string        // Start from specific root
}

// Get category path (breadcrumbs)
GET /categories/:id/path
Response: Category[]     // Array from root to category
```

### Admin API (`/admin/categories`)

```typescript
// Create category
POST /admin/categories
Body: {
  nameKey: string
  descriptionKey?: string
  icon?: string
  parentId?: string
  isActive?: boolean
  sortOrder?: number
  createdBy: string
}

// Update category
PUT /admin/categories/:id
Body: {
  nameKey?: string
  descriptionKey?: string
  icon?: string
  parentId?: string
  isActive?: boolean
  sortOrder?: number
  updatedBy: string
}

// Delete category
DELETE /admin/categories/:id

// Toggle category status
PATCH /admin/categories/:id/toggle-status

// Move category to new parent
PATCH /admin/categories/:id/move
Body: {
  newParentId: string | null
}

// Update sort order
PATCH /admin/categories/:id/sort-order
Body: {
  sortOrder: number
}
```

## 📊 Data Model

### Category Entity

```typescript
interface Category {
  // Identity
  id: string
  slug: string // URL-friendly identifier

  // Content (i18n)
  nameKey: string // Translation key
  descriptionKey?: string // Translation key
  icon?: string // Icon identifier/URL

  // Hierarchy
  parentId?: string // Parent category ID
  level: number // Depth in hierarchy (0 = root)
  path: string // Materialized path (e.g., "/root/parent/child")

  // Display
  isActive: boolean // Visibility status
  sortOrder: number // Order within siblings

  // Audit
  createdBy: string
  updatedBy?: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date

  // Relations
  parent?: Category // Parent category
  children?: Category[] // Child categories
}
```

### Database Schema

```prisma
model Category {
  id              String    @id @default(cuid())
  nameKey         String    // Translation key
  descriptionKey  String?   // Translation key
  icon            String?
  parentId        String?
  isActive        Boolean   @default(true)
  sortOrder       Int       @default(0)
  slug            String    @unique
  level           Int       @default(0)
  path            String    // Materialized path

  createdBy       String
  updatedBy       String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  // Relations
  parent          Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children        Category[] @relation("CategoryHierarchy")
  businesses      Business[]

  @@index([parentId])
  @@index([slug])
  @@index([path])
  @@index([isActive])
  @@schema("catalog")
}
```

## 🔧 Service Implementation

### Category Service with Caching

```typescript
export class CategoryService {
  constructor(
    private repository: ICategoryRepository,
    private cache: ICacheService
  )

  @Cache({
    ttl: 3600, // 1 hour
    prefix: 'service:categories',
    keyGenerator: (prefix, method, args) => `${prefix}:${JSON.stringify(args[0])}`
  })
  async getAllCategories(params: CategorySearchParams): Promise<PaginatedResult<Category>> {
    const result = await this.repository.findAll(params)
    return result
  }

  async createCategory(data: CreateCategoryData): Promise<Category> {
    // Validate parent exists
    if (data.parentId) {
      const parentExists = await this.repository.exists(data.parentId)
      if (!parentExists) {
        throw ErrorFactory.businessRuleViolation(
          'Parent category not found',
          'Invalid parent category ID'
        )
      }
    }

    // Generate slug from name
    const slug = this.generateSlug(data.nameKey)

    // Calculate level and path
    const parent = data.parentId ? await this.repository.findById(data.parentId) : null
    const level = parent ? parent.level + 1 : 0
    const path = parent ? `${parent.path}/${slug}` : `/${slug}`

    const category = await this.repository.create({
      ...data,
      slug,
      level,
      path
    })

    // Invalidate cache
    await this.invalidateCache()

    return category
  }
}
```

### Hierarchy Management

```typescript
export class CategoryRepository {
  async getHierarchy(rootId?: string): Promise<Category[]> {
    // Recursive CTE for hierarchy
    const query = `
      WITH RECURSIVE category_tree AS (
        -- Base case: root categories or specific root
        SELECT * FROM catalog.categories
        WHERE ${rootId ? 'id = $1' : 'parent_id IS NULL'}
        AND deleted_at IS NULL
        
        UNION ALL
        
        -- Recursive case: children
        SELECT c.* FROM catalog.categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
        WHERE c.deleted_at IS NULL
      )
      SELECT * FROM category_tree
      ORDER BY level, sort_order, name_key
    `

    const categories = await this.prisma.$queryRaw(query, rootId)
    return this.buildTree(categories)
  }

  private buildTree(flat: Category[]): Category[] {
    const map = new Map<string, Category>()
    const roots: Category[] = []

    // First pass: create map
    flat.forEach((cat) => {
      map.set(cat.id, { ...cat, children: [] })
    })

    // Second pass: build tree
    flat.forEach((cat) => {
      const node = map.get(cat.id)!
      if (cat.parentId) {
        const parent = map.get(cat.parentId)
        parent?.children?.push(node)
      } else {
        roots.push(node)
      }
    })

    return roots
  }
}
```

## 🌐 Internationalization

### Translation Integration

```typescript
// Category names and descriptions use translation keys
const category = {
  nameKey: 'category.food.restaurants',
  descriptionKey: 'category.food.restaurants.desc',
}

// Translations managed separately
translations = {
  'category.food.restaurants': {
    es: 'Restaurantes',
    en: 'Restaurants',
    gn: 'Restaurantes',
  },
  'category.food.restaurants.desc': {
    es: 'Lugares para comer',
    en: 'Places to eat',
    gn: 'Tenda ojekaru hag̃ua',
  },
}

// Controller resolves translations
const translatedCategories = await Promise.all(
  categories.map(async (cat) => ({
    ...cat,
    name: await translationService.get(cat.nameKey, language),
    description: cat.descriptionKey ? await translationService.get(cat.descriptionKey, language) : null,
  })),
)
```

## 🚀 Performance Optimization

### Caching Strategy

```typescript
// Multi-level caching
class CategoryCacheManager {
  // L1: In-memory cache for hot data
  private memoryCache = new LRUCache<string, Category>({
    max: 500,
    ttl: 1000 * 60 * 5, // 5 minutes
  })

  // L2: Redis cache for distributed access
  private redisCache: ICacheService

  async get(key: string): Promise<Category | null> {
    // Check L1
    const memCached = this.memoryCache.get(key)
    if (memCached) return memCached

    // Check L2
    const redisCached = await this.redisCache.get(key)
    if (redisCached) {
      this.memoryCache.set(key, redisCached)
      return redisCached
    }

    return null
  }

  async set(key: string, value: Category, ttl: number) {
    this.memoryCache.set(key, value)
    await this.redisCache.set(key, value, ttl)
  }
}
```

### Query Optimization

```typescript
// Optimized queries with proper indexes
@@index([parentId, isActive, sortOrder])
@@index([slug])
@@index([path])
@@index([level, isActive])

// Materialized path for fast subtree queries
const subtreeCategories = await prisma.category.findMany({
  where: {
    path: {
      startsWith: parentCategory.path
    },
    isActive: true
  },
  orderBy: [
    { level: 'asc' },
    { sortOrder: 'asc' }
  ]
})
```

## 🧪 Testing

### Integration Tests

```typescript
describe('Category API', () => {
  describe('POST /admin/categories', () => {
    it('should create category with hierarchy', async () => {
      const parent = await createTestCategory({ name: 'Food' })

      const response = await request(app)
        .post('/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nameKey: 'category.food.restaurants',
          parentId: parent.id,
          icon: 'restaurant-icon',
          sortOrder: 1,
          createdBy: 'admin-user',
        })
        .expect(201)

      expect(response.body).toMatchObject({
        nameKey: 'category.food.restaurants',
        parentId: parent.id,
        level: 1,
        path: expect.stringContaining('/restaurants'),
      })
    })

    it('should prevent circular references', async () => {
      const cat1 = await createTestCategory()

      await request(app).patch(`/admin/categories/${cat1.id}/move`).set('Authorization', `Bearer ${adminToken}`).send({ newParentId: cat1.id }).expect(400)
    })
  })
})
```

### Unit Tests

```typescript
describe('CategoryService', () => {
  describe('moveCategory', () => {
    it('should update path for entire subtree', async () => {
      const service = new CategoryService(mockRepo, mockCache)

      // Setup: A -> B -> C hierarchy
      const catA = { id: 'a', path: '/a', level: 0 }
      const catB = { id: 'b', path: '/a/b', level: 1, parentId: 'a' }
      const catC = { id: 'c', path: '/a/b/c', level: 2, parentId: 'b' }

      // Move B to root
      await service.moveCategory('b', null)

      // Verify entire subtree updated
      expect(mockRepo.update).toHaveBeenCalledWith('b', {
        parentId: null,
        path: '/b',
        level: 0,
      })

      // C should also be updated
      expect(mockRepo.updateSubtreePaths).toHaveBeenCalledWith('b', '/b')
    })
  })
})
```

## 🔧 Configuration

### Environment Variables

```bash
# Service Configuration
CATEGORY_SERVICE_PORT=5512
CATEGORY_SERVICE_HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/pika

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
CATEGORY_CACHE_TTL=3600

# Feature Flags
ENABLE_CATEGORY_CACHE=true
ENABLE_HIERARCHY_CACHE=true
MAX_CATEGORY_DEPTH=5

# Pagination
DEFAULT_CATEGORY_LIMIT=20
MAX_CATEGORY_LIMIT=100
```

## 📊 Monitoring & Analytics

### Category Metrics

```typescript
// Track category operations
metrics.increment('category.created', { level: category.level })
metrics.increment('category.moved', { from_level: oldLevel, to_level: newLevel })
metrics.gauge('category.total_active', activeCount)
metrics.histogram('category.hierarchy_depth', maxDepth)

// Cache performance
metrics.increment('category.cache.hit')
metrics.increment('category.cache.miss')
metrics.timer('category.cache.invalidation')

// Query performance
metrics.histogram('category.query.duration', {
  operation: 'getHierarchy',
  cache_hit: false,
})
```

## 🔒 Security

### Access Control

```typescript
// Public read access
router.get('/categories', controller.getAll)

// Admin write access
router.post('/admin/categories', authenticate(), authorize('admin'), validate(createCategorySchema), controller.create)

// Validation schemas
const createCategorySchema = z.object({
  nameKey: z.string().min(1).max(100),
  descriptionKey: z.string().max(100).optional(),
  icon: z.string().max(255).optional(),
  parentId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  createdBy: z.string().uuid(),
})
```

## 🎯 Best Practices

### Hierarchy Management

1. **Limit Depth**: Set maximum nesting levels
2. **Use Materialized Paths**: Fast subtree queries
3. **Maintain Sort Order**: Consistent ordering
4. **Validate Moves**: Prevent circular references
5. **Cache Aggressively**: Categories change infrequently

### Performance Tips

1. **Bulk Load**: Use `getCategoriesByIds` for multiple
2. **Cache Hierarchies**: Long TTL for tree structures
3. **Lazy Load Children**: Don't always include children
4. **Index Paths**: For subtree queries
5. **Paginate Lists**: Limit result sets

## 📝 Changelog

### Recent Updates

- Implemented hierarchical category structure
- Added materialized path for fast queries
- Created comprehensive caching system
- Added bulk operations support
- Implemented move and reorder operations
- Added circular reference prevention
- Enhanced search and filtering

---

**Package Version**: 1.0.0  
**Last Updated**: 2025-01-27  
**Maintainer**: Platform Team
