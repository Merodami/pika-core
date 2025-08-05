#!/usr/bin/env tsx
import chalk from 'chalk'
import ora from 'ora'

interface TestCase {
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  headers?: Record<string, string>
  body?: any
  expectedStatus: number
  validateResponse?: (response: any) => boolean
}

class SmokeTestRunner {
  private baseUrl: string
  private results: { test: string; passed: boolean; error?: string }[] = []

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
  }

  async runAll() {
    console.log(
      chalk.bold.blue(`\n🔥 Running Smoke Tests against ${this.baseUrl}\n`),
    )

    // Define test cases
    const testCases: TestCase[] = [
      // Health checks
      {
        name: 'Main health check',
        method: 'GET',
        path: '/health',
        expectedStatus: 200,
        validateResponse: (res) =>
          res.status === 'healthy' || res.status === 'degraded',
      },
      {
        name: 'Auth service health',
        method: 'GET',
        path: '/auth/health',
        expectedStatus: 200,
        validateResponse: (res) => res.status === 'ok',
      },
      {
        name: 'User service health',
        method: 'GET',
        path: '/users/health',
        expectedStatus: 200,
        validateResponse: (res) => res.status === 'ok',
      },
      {
        name: 'Gym service health',
        method: 'GET',
        path: '/gyms/health',
        expectedStatus: 200,
        validateResponse: (res) => res.status === 'ok',
      },
      {
        name: 'Session service health',
        method: 'GET',
        path: '/sessions/health',
        expectedStatus: 200,
        validateResponse: (res) => res.status === 'ok',
      },

      // API Gateway routes
      {
        name: 'API v1 health through gateway',
        method: 'GET',
        path: '/api/v1/health',
        expectedStatus: 200,
      },

      // Authentication endpoints
      {
        name: 'Login endpoint (invalid credentials)',
        method: 'POST',
        path: '/auth/login',
        body: { email: 'test@example.com', password: 'wrongpassword' },
        headers: { 'Content-Type': 'application/json' },
        expectedStatus: 401,
      },

      // Public endpoints
      {
        name: 'List gyms (public)',
        method: 'GET',
        path: '/gyms',
        expectedStatus: 200,
        validateResponse: (res) => Array.isArray(res.data),
      },

      // Error handling
      {
        name: '404 handling',
        method: 'GET',
        path: '/non-existent-route',
        expectedStatus: 404,
        validateResponse: (res) => res.error?.code === 'NOT_FOUND',
      },

      // CORS headers
      {
        name: 'CORS preflight',
        method: 'OPTIONS',
        path: '/api/v1/users',
        headers: {
          Origin: 'https://example.com',
          'Access-Control-Request-Method': 'GET',
        },
        expectedStatus: 204,
      },
    ]

    // Run tests
    for (const testCase of testCases) {
      await this.runTest(testCase)
    }

    // Print results
    this.printResults()
  }

  private async runTest(testCase: TestCase) {
    const spinner = ora(`Testing: ${testCase.name}`).start()

    try {
      const url = `${this.baseUrl}${testCase.path}`
      const options: RequestInit = {
        method: testCase.method,
        headers: testCase.headers || {},
      }

      if (testCase.body) {
        options.body = JSON.stringify(testCase.body)
        options.headers = {
          ...options.headers,
          'Content-Type': 'application/json',
        }
      }

      const response = await fetch(url, options)
      const responseData =
        testCase.method !== 'OPTIONS' &&
        response.headers.get('content-type')?.includes('application/json')
          ? await response.json()
          : null

      // Check status code
      if (response.status !== testCase.expectedStatus) {
        throw new Error(
          `Expected status ${testCase.expectedStatus}, got ${response.status}`,
        )
      }

      // Validate response if validator provided
      if (testCase.validateResponse && responseData) {
        if (!testCase.validateResponse(responseData)) {
          throw new Error('Response validation failed')
        }
      }

      spinner.succeed(`${testCase.name} - ${chalk.green('PASSED')}`)
      this.results.push({ test: testCase.name, passed: true })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'

      spinner.fail(`${testCase.name} - ${chalk.red('FAILED')}: ${errorMessage}`)
      this.results.push({
        test: testCase.name,
        passed: false,
        error: errorMessage,
      })
    }
  }

  private printResults() {
    console.log(chalk.bold.blue('\n📊 Test Results\n'))

    const passed = this.results.filter((r) => r.passed).length
    const failed = this.results.filter((r) => !r.passed).length
    const total = this.results.length

    // Print detailed results
    this.results.forEach((result) => {
      const icon = result.passed ? '✅' : '❌'
      const color = result.passed ? chalk.green : chalk.red

      console.log(`${icon} ${color(result.test)}`)
      if (result.error) {
        console.log(chalk.gray(`   Error: ${result.error}`))
      }
    })

    // Print summary
    console.log('\n' + chalk.bold('Summary:'))
    console.log(chalk.green(`  Passed: ${passed}/${total}`))
    console.log(chalk.red(`  Failed: ${failed}/${total}`))
    console.log(
      chalk.blue(`  Success Rate: ${Math.round((passed / total) * 100)}%`),
    )

    if (failed > 0) {
      console.log(chalk.red.bold('\n❌ Smoke tests failed!'))
      process.exit(1)
    } else {
      console.log(chalk.green.bold('\n✅ All smoke tests passed!'))
    }
  }
}

// Parse command line arguments
const baseUrl =
  process.argv[2] || process.env.DEPLOYMENT_URL || 'http://localhost:3000'

if (!baseUrl) {
  console.error(chalk.red('Error: Please provide a base URL'))
  console.log('Usage: yarn tsx scripts/smoke-tests.ts <base-url>')
  console.log('Or set DEPLOYMENT_URL environment variable')
  process.exit(1)
}

// Run tests
const runner = new SmokeTestRunner(baseUrl)

runner.runAll().catch((error) => {
  console.error(chalk.red('Fatal error:'), error)
  process.exit(1)
})
