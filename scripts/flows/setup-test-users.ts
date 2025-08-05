#!/usr/bin/env tsx

import { UserRole, UserStatus } from '@pika/types'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const prisma = new PrismaClient()

// Test users configuration
const TEST_USERS = [
  {
    email: 'admin@example.com',
    password: 'AdminPassword123!',
    firstName: 'Admin',
    lastName: 'User',
    phoneNumber: '+15551234567',
    role: UserRole.ADMIN,
    emailVerified: true,
    phoneVerified: true,
  },
  {
    email: 'customer@example.com',
    password: 'CustomerPassword123!',
    firstName: 'Test',
    lastName: 'Customer',
    phoneNumber: '+15551234568',
    role: UserRole.CUSTOMER,
    emailVerified: true,
    phoneVerified: true,
  },
  {
    email: 'business@example.com',
    password: 'BusinessPassword123!',
    firstName: 'Business',
    lastName: 'Owner',
    phoneNumber: '+15551234569',
    role: UserRole.BUSINESS,
    emailVerified: true,
    phoneVerified: true,
  },
  {
    email: 'unverified@example.com',
    password: 'UnverifiedPassword123!',
    firstName: 'Unverified',
    lastName: 'User',
    phoneNumber: '+15551234570',
    role: UserRole.CUSTOMER,
    emailVerified: false,
    phoneVerified: false,
  },
]

async function createTestUsers() {
  console.log('🚀 Setting up test users for flow tests...\n')

  for (const userData of TEST_USERS) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      })

      if (existingUser) {
        // Update user to ensure correct state
        const hashedPassword = await bcrypt.hash(userData.password, 10)

        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            password: hashedPassword,
            role: userData.role,
            status: UserStatus.ACTIVE,
            emailVerified: userData.emailVerified,
            phoneVerified: userData.phoneVerified,
            firstName: userData.firstName,
            lastName: userData.lastName,
            phoneNumber: userData.phoneNumber,
          },
        })

        console.log(`✅ Updated existing user: ${userData.email}`)
      } else {
        // Create new user
        const hashedPassword = await bcrypt.hash(userData.password, 10)

        const user = await prisma.user.create({
          data: {
            email: userData.email,
            password: hashedPassword,
            firstName: userData.firstName,
            lastName: userData.lastName,
            phoneNumber: userData.phoneNumber,
            role: userData.role,
            status: UserStatus.ACTIVE,
            emailVerified: userData.emailVerified,
            phoneVerified: userData.phoneVerified,
          },
        })

        console.log(`✅ Created new user: ${userData.email}`)
      }

      console.log(`   Role: ${userData.role}`)
      console.log(`   Email Verified: ${userData.emailVerified}`)
      console.log(`   Password: ${userData.password}`)
      console.log()
    } catch (error) {
      console.error(`❌ Failed to process user ${userData.email}:`, error)
    }
  }

  console.log('\n📋 Summary of test users:')
  console.log('========================')

  for (const user of TEST_USERS) {
    console.log(
      `${user.email} - ${user.role} - Verified: ${user.emailVerified}`,
    )
  }

  console.log('\n✨ Test user setup complete!')
}

// Run if called directly
import { fileURLToPath } from 'url'

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url)

if (isMainModule) {
  createTestUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Setup failed:', error)
      process.exit(1)
    })
    .finally(() => prisma.$disconnect())
}

export { createTestUsers, TEST_USERS }
