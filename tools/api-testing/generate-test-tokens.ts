#!/usr/bin/env tsx

/**
 * Generate test users with different roles and obtain their access tokens
 * REQUIRES: Services must be running (yarn local)
 * Usage: yarn generate:tokens
 */

import { faker } from '@faker-js/faker'
import { PrismaClient, UserRole, UserStatus } from '@prisma/client'
import axios from 'axios'
import bcrypt from 'bcrypt'
import { config } from 'dotenv'
import { writeFileSync } from 'fs'
import { join, resolve } from 'path'

// Load environment variables from project root
config({ path: resolve(process.cwd(), '.env') })

const DEFAULT_PASSWORD = 'TestPassword123!'
const API_URL = 'http://127.0.0.1:5500/api/v1'

// Test users to create
const TEST_USERS = [
  { email: 'test.admin@pika.com', role: UserRole.ADMIN, name: 'Test Admin' },
  {
    email: 'test.member@pika.com',
    role: UserRole.MEMBER,
    name: 'Test Member',
  },
  {
    email: 'test.professional@pika.com',
    role: UserRole.PROFESSIONAL,
    name: 'Test Professional',
  },
  {
    email: 'test.therapist@pika.com',
    role: UserRole.THERAPIST,
    name: 'Test Therapist',
  },
  {
    email: 'test.creator@pika.com',
    role: UserRole.CONTENT_CREATOR,
    name: 'Test Creator',
  },
]

async function main() {
  console.log('🔐 Generating test users and access tokens...')
  console.log('📍 API URL:', API_URL)

  const prisma = new PrismaClient()
  const tokens: any = {}

  try {
    // Step 1: Create users in database
    console.log('\n📝 Creating test users in database...')

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)

    for (const testUser of TEST_USERS) {
      const [firstName, lastName] = testUser.name.split(' ')

      await prisma.user.upsert({
        where: { email: testUser.email },
        update: {
          password: hashedPassword,
          role: testUser.role,
          status: UserStatus.ACTIVE,
          emailVerified: true,
          firstName,
          lastName,
        },
        create: {
          email: testUser.email,
          password: hashedPassword,
          role: testUser.role,
          status: UserStatus.ACTIVE,
          emailVerified: true,
          firstName,
          lastName,
          phoneNumber: faker.phone.number(),
          phoneVerified: true,
          avatarUrl: null,
          dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
        },
      })

      console.log(`✅ Created/Updated ${testUser.role}: ${testUser.email}`)
    }

    // Step 2: Login via API to get tokens
    console.log('\n🔑 Getting access tokens via API...')

    for (const testUser of TEST_USERS) {
      try {
        // First try to register (in case auth service has separate DB)
        try {
          await axios.post(`${API_URL}/auth/register`, {
            email: testUser.email,
            password: DEFAULT_PASSWORD,
            firstName: testUser.name.split(' ')[0],
            lastName: testUser.name.split(' ')[1],
            dateOfBirth: '1990-01-01',
            acceptTerms: true,
            role: testUser.role,
          })
        } catch (err: any) {
          // User might already exist, that's ok
          if (!err.response?.data?.message?.includes('already exists')) {
            console.log(
              `⚠️  Registration note for ${testUser.email}:`,
              err.response?.data?.message || 'User might already exist',
            )
          }
        }

        // Now login to get tokens
        const loginResponse = await axios.post(`${API_URL}/auth/token`, {
          grantType: 'password',
          username: testUser.email,
          password: DEFAULT_PASSWORD,
        })

        const { accessToken, refreshToken, user } = loginResponse.data

        // Store token info
        tokens[testUser.role.toLowerCase()] = {
          userId: user?.id || 'unknown',
          email: testUser.email,
          role: testUser.role,
          name: testUser.name,
          password: DEFAULT_PASSWORD,
          accessToken,
          refreshToken,
        }

        console.log(`✅ Got token for ${testUser.email}`)
      } catch (error: any) {
        console.error(`❌ Failed to get token for ${testUser.email}:`)
        console.error('  Status:', error.response?.status)
        console.error(
          '  Response:',
          JSON.stringify(error.response?.data, null, 2),
        )
      }
    }

    // Save tokens to JSON file
    const outputData = {
      generated: new Date().toISOString(),
      description:
        'Development test tokens. Expiry depends on JWT_ACCESS_EXPIRY setting.',
      apiUrl: API_URL,
      defaultPassword: DEFAULT_PASSWORD,
      usage: {
        curl: 'curl -H "Authorization: Bearer ${accessToken}" ${apiUrl}/users/me',
        axios:
          'axios.get("/users/me", { headers: { Authorization: `Bearer ${accessToken}` } })',
        postman:
          'In Authorization tab, select "Bearer Token" and paste the accessToken',
      },
      tokens,
    }

    const outputFile = join(process.cwd(), 'test-tokens.json')

    writeFileSync(outputFile, JSON.stringify(outputData, null, 2))

    // Display results
    console.log('\n' + '='.repeat(80))
    console.log('🎉 TEST TOKENS GENERATED SUCCESSFULLY!')
    console.log('='.repeat(80))
    console.log(`\n📅 Generated at: ${new Date().toISOString()}`)
    console.log(`🔑 Password: ${DEFAULT_PASSWORD}`)
    console.log(`🌐 API URL: ${API_URL}`)

    console.log('\n📋 Test Accounts:')
    console.log('─'.repeat(80))
    Object.entries(tokens).forEach(([role, data]: [string, any]) => {
      console.log(`\n${role.toUpperCase()}:`)
      console.log(`  Name: ${data.name}`)
      console.log(`  Email: ${data.email}`)
      console.log(`  User ID: ${data.userId}`)
      console.log(`  Access Token: ${data.accessToken?.substring(0, 50)}...`)
    })

    console.log('\n' + '─'.repeat(80))
    console.log('\n📄 Output saved to: test-tokens.json')
    console.log('\n🚀 Quick Test:')

    const adminToken = tokens.admin?.accessToken

    if (adminToken) {
      console.log(`\ncurl -H "Authorization: Bearer ${adminToken}" \\`)
      console.log(`     ${API_URL}/users/me`)
    }
    console.log(
      '\n💡 Tip: Import test-tokens.json into Postman for easy API testing!',
    )
    console.log(
      '\n⚠️  Note: For long-lasting tokens (1 year), set JWT_ACCESS_EXPIRY=365d in .env',
    )
    console.log('\n' + '='.repeat(80))
  } catch (error) {
    console.error('Failed to generate test tokens:', error)
    console.log('\n💡 Make sure services are running: yarn local')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
