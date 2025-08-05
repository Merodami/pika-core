/**
 * Category Service Test Helpers
 *
 * Shared test utilities and data factories for category integration tests.
 * Following the factory pattern for test data generation.
 *
 * Key features:
 * - Creates test data with proper hierarchical relationships
 * - Supports various category states (active/inactive)
 * - Provides shared test data for efficient test execution
 * - Handles category tree structures (parent-child relationships)
 */

import type { PrismaClient } from '@prisma/client'
import { v4 as uuid } from 'uuid'

export interface CategoryTestData {
  parentCategory: any
  childCategories: any[]
}

/**
 * Shared test data structure for reuse across tests
 * Created once in beforeAll() and reused across all tests for performance
 */
export interface SharedCategoryTestData {
  // Categories by type
  activeParentCategories: any[]
  inactiveParentCategories: any[]
  activeChildCategories: any[]
  inactiveChildCategories: any[]

  // Quick access
  allCategories: any[]
  categoryById: Map<string, any>
  rootCategories: any[]
}

export interface SeedCategoryOptions {
  generateInactive?: boolean
  childCount?: number
  adminUserId?: string
}

/**
 * Factory function to create test categories with proper relationships
 *
 * @param prismaClient - Prisma client instance
 * @param options - Options for generating test data
 * @returns Object containing created parent and child categories
 */
export async function seedTestCategories(
  prismaClient: PrismaClient,
  options: SeedCategoryOptions = {},
): Promise<CategoryTestData> {
  const {
    generateInactive = false,
    childCount = 2,
    adminUserId = uuid(),
  } = options

  const parentSlug = `parent-category-${uuid().substring(0, 8)}`
  const parentCategory = await prismaClient.category.create({
    data: {
      nameKey: 'categories.parent.name',
      descriptionKey: 'categories.parent.description',
      slug: parentSlug,
      level: 1,
      path: '',
      isActive: generateInactive ? false : true,
      sortOrder: 1,
      createdBy: adminUserId,
    },
  })

  const childCategories = []

  for (let i = 0; i < childCount; i++) {
    const childSlug = `child-category-${i}-${uuid().substring(0, 8)}`
    const child = await prismaClient.category.create({
      data: {
        nameKey: `categories.child.${i + 1}.name`,
        descriptionKey: `categories.child.${i + 1}.description`,
        slug: childSlug,
        parentId: parentCategory.id,
        level: 2,
        path: parentCategory.id,
        isActive: true,
        sortOrder: i + 1,
        createdBy: adminUserId,
      },
    })

    childCategories.push(child)
  }

  return { parentCategory, childCategories }
}

/**
 * Factory function to create a single test category
 */
export async function createTestCategory(
  prismaClient: PrismaClient,
  options: {
    nameKey?: string
    descriptionKey?: string
    parentId?: string
    isActive?: boolean
    sortOrder?: number
    adminUserId?: string
  } = {},
) {
  const {
    nameKey = `category.test.${uuid()}`,
    descriptionKey = `category.test.description.${uuid()}`,
    parentId,
    isActive = true,
    sortOrder = 0,
    adminUserId = uuid(),
  } = options

  const slug = `test-category-${uuid().substring(0, 8)}`

  return await prismaClient.category.create({
    data: {
      nameKey,
      descriptionKey,
      slug,
      parentId,
      level: parentId ? 2 : 1,
      path: parentId || '',
      isActive,
      sortOrder,
      createdBy: adminUserId,
    },
  })
}

/**
 * Clean up test data - useful for afterEach hooks
 */
export async function cleanupCategoryTestData(
  prismaClient: PrismaClient,
  options: {
    preserveSharedData?: boolean
    sharedCategoryIds?: string[]
  } = {},
) {
  if (!options.preserveSharedData) {
    await prismaClient.category.deleteMany({})
  } else if (options.sharedCategoryIds) {
    // Delete all categories except the shared ones
    await prismaClient.category.deleteMany({
      where: {
        id: {
          notIn: options.sharedCategoryIds,
        },
      },
    })
  }
}

/**
 * Generate test category data without persisting to database
 * Useful for testing DTOs and mappers
 */
export function generateCategoryTestData(
  options: {
    count?: number
    includeInactive?: boolean
    includeChildren?: boolean
  } = {},
) {
  const {
    count = 3,
    includeInactive = false,
    includeChildren = false,
  } = options
  const categories = []

  for (let i = 0; i < count; i++) {
    const category = {
      id: uuid(),
      nameKey: `test.category.name.${i + 1}`,
      descriptionKey: `test.category.description.${i + 1}`,
      slug: `test-category-${i + 1}`,
      parentId: null,
      level: 1,
      path: '',
      isActive: includeInactive ? i % 2 === 0 : true,
      sortOrder: i,
      createdBy: uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    categories.push(category)

    if (includeChildren) {
      for (let j = 0; j < 2; j++) {
        categories.push({
          id: uuid(),
          nameKey: `test.category.child.${i + 1}.${j + 1}`,
          descriptionKey: `test.category.child.description.${i + 1}.${j + 1}`,
          slug: `test-child-category-${i + 1}-${j + 1}`,
          parentId: category.id,
          level: 2,
          path: category.id,
          isActive: true,
          sortOrder: j,
          createdBy: uuid(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    }
  }

  return categories
}

/**
 * Create comprehensive shared test data for all tests
 * This creates a variety of categories in different states that can be reused
 */
export async function createSharedCategoryTestData(
  prismaClient: PrismaClient,
  adminUserId: string = uuid(),
): Promise<SharedCategoryTestData> {
  const activeParentCategories: any[] = []
  const inactiveParentCategories: any[] = []
  const activeChildCategories: any[] = []
  const inactiveChildCategories: any[] = []
  const allCategories: any[] = []
  const categoryById = new Map<string, any>()
  const rootCategories: any[] = []

  // Create active parent categories
  for (let i = 0; i < 3; i++) {
    const parent = await createTestCategory(prismaClient, {
      nameKey: `test.category.active.parent.${i + 1}`,
      descriptionKey: `test.category.active.parent.description.${i + 1}`,
      isActive: true,
      sortOrder: i,
      adminUserId,
    })

    activeParentCategories.push(parent)
    rootCategories.push(parent)
    allCategories.push(parent)
    categoryById.set(parent.id, parent)

    // Create children for each active parent
    for (let j = 0; j < 2; j++) {
      const child = await createTestCategory(prismaClient, {
        nameKey: `test.category.active.child.${i + 1}.${j + 1}`,
        descriptionKey: `test.category.active.child.description.${i + 1}.${j + 1}`,
        parentId: parent.id,
        isActive: true,
        sortOrder: j,
        adminUserId,
      })

      activeChildCategories.push(child)
      allCategories.push(child)
      categoryById.set(child.id, child)
    }
  }

  // Create inactive parent categories
  for (let i = 0; i < 2; i++) {
    const parent = await createTestCategory(prismaClient, {
      nameKey: `test.category.inactive.parent.${i + 1}`,
      descriptionKey: `test.category.inactive.parent.description.${i + 1}`,
      isActive: false,
      sortOrder: 10 + i,
      adminUserId,
    })

    inactiveParentCategories.push(parent)
    rootCategories.push(parent)
    allCategories.push(parent)
    categoryById.set(parent.id, parent)
  }

  // Create some inactive children for active parents
  const activeParent = activeParentCategories[0]

  for (let i = 0; i < 2; i++) {
    const inactiveChild = await createTestCategory(prismaClient, {
      nameKey: `test.category.inactive.child.${i + 1}`,
      descriptionKey: `test.category.inactive.child.description.${i + 1}`,
      parentId: activeParent.id,
      isActive: false,
      sortOrder: 10 + i,
      adminUserId,
    })

    inactiveChildCategories.push(inactiveChild)
    allCategories.push(inactiveChild)
    categoryById.set(inactiveChild.id, inactiveChild)
  }

  return {
    activeParentCategories,
    inactiveParentCategories,
    activeChildCategories,
    inactiveChildCategories,
    allCategories,
    categoryById,
    rootCategories,
  }
}
