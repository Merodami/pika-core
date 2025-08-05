import { PrismaClient } from '@prisma/client'

import { seedTranslationData } from './translations.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  try {
    await seedTranslationData(prisma)

    console.log('✅ Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Database seeding failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('❌ Seeding error:', error)
  process.exit(1)
})
