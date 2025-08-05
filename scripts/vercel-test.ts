#!/usr/bin/env tsx
import chalk from 'chalk'
import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import ora from 'ora'
import { basename,join, resolve } from 'path'

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'skip'
  message?: string
  duration?: number
}

class VercelDeploymentTester {
  private results: TestResult[] = []
  private rootDir: string

  constructor() {
    this.rootDir = process.cwd()
  }

  async runAll() {
    console.log(chalk.bold.blue('\n🚀 Vercel Deployment Testing Suite\n'))

    await this.testEnvironmentSetup()
    await this.testBuildProcess()
    await this.testDeploymentFiles()
    await this.testVercelConfig()
    await this.testFunctionBundling()
    await this.testLocalVercelDev()

    this.printResults()
  }

  private async testEnvironmentSetup() {
    const spinner = ora('Testing environment setup...').start()
    const startTime = Date.now()

    try {
      // Check Node version
      const nodeVersion = process.version
      const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1))

      if (majorVersion < 22) {
        throw new Error(`Node.js 22+ required, found ${nodeVersion}`)
      }

      // Check Yarn version
      const yarnVersion = execSync('yarn --version', {
        encoding: 'utf-8',
      }).trim()

      if (!yarnVersion.startsWith('4.')) {
        throw new Error(`Yarn 4+ required, found ${yarnVersion}`)
      }

      // Check required environment variables
      const requiredEnvVars = [
        'DATABASE_URL',
        'REDIS_URL',
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
      ]

      const missingVars = requiredEnvVars.filter(
        (v) => !process.env[v as keyof typeof process.env],
      )

      if (missingVars.length > 0) {
        console.warn(
          chalk.yellow(
            `\n⚠️  Missing environment variables: ${missingVars.join(', ')}`,
          ),
        )
        console.log(
          chalk.gray('These will need to be set in Vercel dashboard\n'),
        )
      }

      spinner.succeed('Environment setup verified')
      this.results.push({
        name: 'Environment Setup',
        status: 'pass',
        duration: Date.now() - startTime,
      })
    } catch (error) {
      spinner.fail('Environment setup failed')
      this.results.push({
        name: 'Environment Setup',
        status: 'fail',
        message: error.message,
      })
    }
  }

  private async testBuildProcess() {
    const spinner = ora('Testing build process...').start()
    const startTime = Date.now()

    try {
      // Test if packages can be built
      execSync('yarn build:vercel', {
        encoding: 'utf-8',
        stdio: 'pipe',
      })

      // Verify critical dist files exist
      const criticalFiles = [
        'packages/deployment/dist/index.js',
        'packages/api-gateway/dist/index.js',
        'packages/shared/dist/index.js',
      ]

      for (const file of criticalFiles) {
        if (!existsSync(join(this.rootDir, file))) {
          throw new Error(`Missing critical build output: ${file}`)
        }
      }

      spinner.succeed('Build process completed successfully')
      this.results.push({
        name: 'Build Process',
        status: 'pass',
        duration: Date.now() - startTime,
      })
    } catch (error) {
      spinner.fail('Build process failed')
      this.results.push({
        name: 'Build Process',
        status: 'fail',
        message: error.message,
      })
    }
  }

  private async testDeploymentFiles() {
    const spinner = ora('Testing deployment files...').start()

    try {
      const requiredFiles = [
        'vercel.json',
        'api/index.js',
        'packages/deployment/package.json',
        '.env.vercel.example',
      ]

      const missingFiles = requiredFiles.filter(
        (f) => !existsSync(join(this.rootDir, f)),
      )

      if (missingFiles.length > 0) {
        throw new Error(`Missing deployment files: ${missingFiles.join(', ')}`)
      }

      // Validate vercel.json with secure path handling
      const safeConfigPath = resolve(this.rootDir, 'vercel.json')

      // Security check: ensure the resolved path is still within our project directory
      if (!safeConfigPath.startsWith(resolve(this.rootDir)) || basename(safeConfigPath) !== 'vercel.json') {
        throw new Error('Invalid vercel.json path')
      }

      if (!existsSync(safeConfigPath)) {
        throw new Error('vercel.json file not found')
      }

      const vercelConfigContent = readFileSync(safeConfigPath, { encoding: 'utf-8' })
      const vercelConfig = JSON.parse(vercelConfigContent)

      if (!vercelConfig.functions?.['api/index.js']) {
        throw new Error('vercel.json missing function configuration')
      }

      if (!vercelConfig.buildCommand?.includes('build:vercel')) {
        throw new Error('vercel.json missing proper build command')
      }

      spinner.succeed('Deployment files validated')
      this.results.push({
        name: 'Deployment Files',
        status: 'pass',
      })
    } catch (error) {
      spinner.fail('Deployment files validation failed')
      this.results.push({
        name: 'Deployment Files',
        status: 'fail',
        message: error.message,
      })
    }
  }

  private async testVercelConfig() {
    const spinner = ora('Testing Vercel configuration...').start()

    try {
      // Test if vercel CLI is installed
      try {
        execSync('vercel --version', { stdio: 'pipe' })
      } catch {
        console.log(chalk.yellow('\nVercel CLI not installed. Installing...'))
        execSync('npm i -g vercel', { stdio: 'pipe' })
      }

      // Validate function size won't exceed limits
      const functionPath = join(this.rootDir, 'api/index.js')
      const stats = require('fs').statSync(functionPath)

      // Vercel limit is 50MB for compressed function
      if (stats.size > 50 * 1024 * 1024) {
        throw new Error('Function size exceeds Vercel limit')
      }

      spinner.succeed('Vercel configuration valid')
      this.results.push({
        name: 'Vercel Configuration',
        status: 'pass',
      })
    } catch (error) {
      spinner.fail('Vercel configuration invalid')
      this.results.push({
        name: 'Vercel Configuration',
        status: 'fail',
        message: error.message,
      })
    }
  }

  private async testFunctionBundling() {
    const spinner = ora('Testing function bundling...').start()
    const startTime = Date.now()

    try {
      // Create a test build to check bundling
      execSync('vercel build', {
        encoding: 'utf-8',
        stdio: 'pipe',
        env: {
          ...process.env,
          VERCEL: '1',
          VERCEL_ENV: 'preview',
        },
      })

      // Check .vercel/output directory
      if (!existsSync(join(this.rootDir, '.vercel/output'))) {
        throw new Error('Vercel build output not created')
      }

      spinner.succeed('Function bundling successful')
      this.results.push({
        name: 'Function Bundling',
        status: 'pass',
        duration: Date.now() - startTime,
      })
    } catch (error) {
      spinner.fail('Function bundling failed')
      this.results.push({
        name: 'Function Bundling',
        status: 'fail',
        message: error.message,
      })
    }
  }

  private async testLocalVercelDev() {
    const spinner = ora('Testing Vercel dev server...').start()

    try {
      // Start vercel dev in background
      const vercelProcess = require('child_process').spawn(
        'vercel',
        ['dev', '--listen', '3333'],
        {
          detached: true,
          stdio: 'pipe',
        },
      )

      // Wait for server to start
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 5000))

      // Test health endpoint
      const response = await fetch('http://localhost:3333/health')

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`)
      }

      const health = await response.json()

      if (health.status !== 'healthy' && health.status !== 'degraded') {
        throw new Error('Health check returned unhealthy status')
      }

      // Kill the process
      process.kill(-vercelProcess.pid)

      spinner.succeed('Vercel dev server working')
      this.results.push({
        name: 'Vercel Dev Server',
        status: 'pass',
      })
    } catch (error) {
      spinner.fail('Vercel dev server test failed')
      this.results.push({
        name: 'Vercel Dev Server',
        status: 'fail',
        message: error.message,
      })
    }
  }

  private printResults() {
    console.log(chalk.bold.blue('\n📊 Test Results\n'))

    const passed = this.results.filter((r) => r.status === 'pass').length
    const failed = this.results.filter((r) => r.status === 'fail').length
    const total = this.results.length

    this.results.forEach((result) => {
      const icon = result.status === 'pass' ? '✅' : '❌'
      const color = result.status === 'pass' ? chalk.green : chalk.red

      console.log(`${icon} ${color(result.name)}`)

      if (result.message) {
        console.log(chalk.gray(`   ${result.message}`))
      }

      if (result.duration) {
        console.log(chalk.gray(`   Duration: ${result.duration}ms`))
      }
    })

    console.log('\n' + chalk.bold('Summary:'))
    console.log(chalk.green(`  Passed: ${passed}`))
    console.log(chalk.red(`  Failed: ${failed}`))
    console.log(chalk.blue(`  Total: ${total}`))

    if (failed > 0) {
      console.log(chalk.red.bold('\n❌ Deployment testing failed!'))
      process.exit(1)
    } else {
      console.log(chalk.green.bold('\n✅ Ready for Vercel deployment!'))
    }
  }
}

// Run tests
const tester = new VercelDeploymentTester()

tester.runAll().catch(console.error)
