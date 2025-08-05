# Pika Test Infrastructure

This package provides shared utilities and infrastructure for testing the Pika application services.

## Features

- Standardized test utilities for all services
- Mock repositories and data fixtures
- Standardized test data
- Integration test helpers
- Database test utilities

## Structure

- `/src/integration/fixtures`: Contains shared test data fixtures
- `/src/integration/utils`: Contains shared test utilities
- `/src/mocks`: Contains standardized mock implementations
  - `/src/mocks/entities`: Standard mock entities (categories, etc.)
  - `/src/mocks/repositories`: Mock repositories with consistent behavior
  - `/src/mocks/helpers`: Helper functions for controller and API testing
- `/src/test-strategy`: Documentation for test implementation strategies

## How to Use

### Running Tests

Tests can be run using the Vitest test runner:

```bash
# Run all tests
yarn vitest

# Run tests with coverage report
yarn test:coverage

# Run tests in a specific service
yarn vitest packages/services/category/read/test

# Run a specific test file
yarn vitest packages/services/category/read/test/integration/category-controller.spec.ts

# Run a specific test file with coverage
yarn vitest --run --coverage packages/services/storage/src/test/integration/e2e/storage-s3.integration.test.ts
```

### Creating Service Tests

1. Create a `test/integration` folder in your service directory
2. Create test files using the `.spec.ts` or `.test.ts` extension
3. Import shared utilities from `@pika/tests`

### Test Patterns

#### Controller Tests

Example pattern for controller tests:

```typescript
import { describe, expect, it, beforeEach } from 'vitest'
import { createMockRequest } from '@pika

import { MyController } from '../../src/api/controllers/MyController.js'
import { myMockData } from './mocks/myMocks.js'

describe('MyController Tests', () => {
  let controller: MyController

  beforeEach(() => {
    // Initialize controller with mocks
    controller = new MyController(...)
  })

  describe('getAll', () => {
    it('should return all items', async () => {
      const request = createMockRequest({
        query: {},
        language: 'en'
      })

      const result = await controller.getAll(request)

      expect(result).toBeDefined()
      expect(result.data.length).toBe(myMockData.length)
    })
  })
})
```

#### API Tests

Example pattern for API endpoint tests:

```typescript
import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import express from 'express'

import { createMyRouter } from '../../src/api/routes/MyRouter.js'
import { myMockData } from './mocks/myMocks.js'

describe('My API Tests', () => {
  let app

  beforeAll(async () => {
    app = express()
    app.use(express.json())
    app.use('/', createMyRouter(...))
  })

  afterAll(async () => {
    // Express doesn't need explicit close
  })

  describe('GET /', () => {
    it('should return all items', async () => {
      const response = await request(app)
        .get('/')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.data.length).toBe(myMockData.length)
    })
  })
})
```

## Environment Variables

Tests use the `.env.test` file in the root directory for environment variables. Make sure this file is available when running tests.

## Docker Test Environment

A Docker Compose configuration file (`docker-compose.test.yml`) is provided to set up test databases and services. To use it:

```bash
# Start the test environment
docker-compose -f docker-compose.test.yml up -d

# Run tests
yarn vitest

# Stop the test environment
docker-compose -f docker-compose.test.yml down
```

## Test Data

All test fixtures are standardized in English for consistency across all tests.

## Coverage Reports

The project uses Vitest's built-in coverage functionality with the v8 provider. Coverage reports are generated in multiple formats:

- **text**: Display coverage summary in the terminal
- **json**: Machine-readable coverage data
- **html**: Interactive HTML report in `coverage/` directory

To view the HTML coverage report after running tests with coverage:

```bash
# Generate coverage report
yarn test:coverage

# Open the HTML report (macOS)
open coverage/index.html

# Open the HTML report (Linux)
xdg-open coverage/index.html
```

Coverage configuration can be found in `vitest.config.ts` at the project root.
