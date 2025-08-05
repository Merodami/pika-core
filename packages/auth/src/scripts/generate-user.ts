#!/usr/bin/env node
/**
 * Simple CLI script to create users for testing login
 * Usage: yarn user:create
 */

import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Parse command line args
  const args = process.argv.slice(2)
  const email = args[0]
  const password = args[1] || 'Test123!'
  const role = (args[2] as UserRole) || 'customer'

  if (!email) {
    console.log('Usage: yarn user:create <email> [password] [role]')
    console.log('Example: yarn user:create test@example.com Test123! ADMIN')
    console.log('Roles: admin, customer, business')
    process.exit(1)
  }

  try {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existing) {
      console.error(`User ${email} already exists`)
      process.exit(1)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+1234567890',
        dateOfBirth: new Date('1990-01-01'),
        role,
        status: 'active',
        emailVerified: true,
      },
    })

    console.log('User created:')
    console.log(`Email: ${user.email}`)
    console.log(`Password: ${password}`)
    console.log(`Role: ${user.role}`)
    console.log(`ID: ${user.id}`)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
