# Zod API Schemas

This directory contains the Zod-based API schema definitions for the Pika platform.

## Overview

Zod provides:

- 🚀 Excellent developer experience with intuitive API
- 🛡️ Branded types for type-safe domain modeling
- 🔄 Transform pipelines for data validation and transformation
- 📝 Clear error messages with `zod-validation-error`
- 🌍 i18n support for validation messages
- 🔗 Strong ecosystem integration (Prisma, tRPC, etc.)

## Directory Structure

```
src/
├── common/           # Shared schemas and utilities
│   ├── schemas/      # Common schema definitions
│   │   ├── branded.ts      # Branded types (UserId, Email, Money, etc.)
│   │   ├── primitives.ts   # Basic types with validation
│   │   ├── responses.ts    # Response schemas and factories
│   │   └── metadata.ts     # Metadata mixins (timestamps, audit, etc.)
│   ├── utils/        # Utility functions
│   │   ├── openapi.ts      # OpenAPI helpers
│   │   └── validators.ts   # Express validation middleware
│   └── registry/     # Schema registry
│       ├── base.ts         # Full-featured registry
│       └── simple.ts       # Simplified registry
├── public/           # Public API schemas
├── admin/            # Admin API schemas
├── internal/         # Internal API schemas
└── scripts/          # Build and generation scripts
```

## Key Features

### 1. Branded Types

```typescript
// Strong typing with branded types
const userId: UserId = UserId.parse('123e4567-e89b-12d3-a456-426614174000')
const email: Email = Email.parse('USER@EXAMPLE.COM') // Normalized to lowercase
const amount: Money = Money.parse(1000) // Amount in cents
```

### 2. Schema Composition

```typescript
// Compose schemas with metadata mixins
const UserSchema = withAudit({
  id: UserId,
  email: Email,
  name: z.string(),
})
```

### 3. Validation Middleware

```typescript
// Express middleware with automatic validation
app.post('/login', validate(LoginRequest), async (req, res) => {
  // req.body is fully typed and validated
})
```

### 4. OpenAPI Generation

```typescript
// Automatic OpenAPI spec generation
const registry = createSimpleRegistry({
  title: 'My API',
  version: '1.0.0',
})
registry.registerSchema('User', UserSchema)
```

## Documentation

### View Documentation

```bash
# Generate and view API documentation
yarn docs

# Or step by step:
yarn generate:openapi    # Generate OpenAPI spec
yarn generate:docs       # Generate Scalar documentation
```

### Available Commands

| Command                 | Description                        |
| ----------------------- | ---------------------------------- |
| `yarn build`            | Build and typecheck schemas        |
| `yarn typecheck`        | Type check schemas only            |
| `yarn test`             | Run schema tests                   |
| `yarn generate:openapi` | Generate OpenAPI JSON spec         |
| `yarn generate:docs`    | Generate Scalar documentation      |
| `yarn docs`             | All-in-one: generate and open docs |

## Schema Examples

### Basic Types

```typescript
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  age: z.number().int().nonnegative(),
})
```

### Optional Fields

```typescript
const ProfileSchema = z.object({
  name: z.string().optional(),
  bio: z.string().max(500).optional(),
})
```

### Enums

```typescript
const Role = z.enum(['USER', 'ADMIN', 'PROFESSIONAL'])
```

### Arrays

```typescript
const Tags = z.array(z.string())
const UserList = z.array(UserSchema)
```

### Custom Validation

```typescript
const Password = z
  .string()
  .min(8)
  .refine((val) => /[A-Z]/.test(val), 'Must contain uppercase')
  .refine((val) => /[a-z]/.test(val), 'Must contain lowercase')
  .refine((val) => /[0-9]/.test(val), 'Must contain number')
```

## Best Practices

1. **Use Branded Types** for domain modeling

   ```typescript
   // Don't use plain strings for IDs
   const userId: string = '123' // ❌

   // Use branded types
   const userId: UserId = UserId.parse('123') // ✅
   ```

2. **Compose Schemas** for consistency

   ```typescript
   // Use metadata mixins
   const Entity = withTimestamps({
     id: z.string().uuid(),
     name: z.string(),
   })
   ```

3. **Provide Clear Error Messages**

   ```typescript
   const Age = z.number().int('Age must be a whole number').min(0, 'Age cannot be negative').max(150, 'Age seems unrealistic')
   ```

4. **Use Transform for Data Normalization**
   ```typescript
   const Email = z
     .string()
     .email()
     .transform((email) => email.toLowerCase().trim())
   ```

## Testing

```typescript
import { describe, it, expect } from 'vitest'
import { UserSchema } from './schemas'

describe('UserSchema', () => {
  it('should validate correct data', () => {
    const data = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'user@example.com',
      name: 'John Doe',
    }

    const result = UserSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should reject invalid email', () => {
    const data = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'not-an-email',
      name: 'John Doe',
    }

    const result = UserSchema.safeParse(data)
    expect(result.success).toBe(false)
    expect(result.error.issues[0].path).toEqual(['email'])
  })
})
```

## Integration with Services

### Using in Express Routes

```typescript
import { validateBody } from '@pika/http'
import { CreateUserRequest } from '@pikapi/public'

router.post('/users', validateBody(CreateUserRequest), async (req, res) => {
  // req.body is typed as CreateUserRequest
  const user = await userService.create(req.body)
  res.json(user)
})
```

### Using in Services

```typescript
import { UserId, CreateUserRequest } from '@pikapi/public'

class UserService {
  async create(data: CreateUserRequest) {
    // Data is already validated by middleware
    return this.repository.create(data)
  }

  async findById(id: UserId) {
    // id is branded, ensuring type safety
    return this.repository.findById(id)
  }
}
```

## Troubleshooting

### Common Issues

1. **Import Errors**
   - Always use `.js` extension in imports (ESM requirement)
   - Import from the index: `from '@pikapi/zod'`

2. **Type Inference**

   ```typescript
   // If types aren't inferred correctly
   type MyType = z.infer<typeof MySchema>
   ```

3. **Circular Dependencies**
   - Use `z.lazy()` for recursive schemas
   ```typescript
   const Node: z.ZodType<NodeType> = z.lazy(() =>
     z.object({
       value: z.string(),
       children: z.array(Node),
     }),
   )
   ```

## Resources

- [Zod Documentation](https://zod.dev)
- [zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi)
- [zod-validation-error](https://github.com/causaly/zod-validation-error)
- [Zod Playground](https://zod-playground.netlify.app/)
