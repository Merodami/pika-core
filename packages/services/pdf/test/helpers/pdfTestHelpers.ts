/**
 * PDF Service Test Helpers
 *
 * Shared test utilities and data factories for PDF integration tests.
 * Following the factory pattern for test data generation.
 *
 * Key features:
 * - Creates test data with proper foreign key relationships
 * - Supports various voucher book states (draft/published)
 * - Provides shared test data for efficient test execution
 * - Handles proper test data cleanup and relationships
 */

import { createVoucherServiceClientMock } from '@pika/tests'
import type { PrismaClient } from '@prisma/client'
import { v4 as uuid } from 'uuid'

export interface VoucherBookTestData {
  voucherBooks: any[]
  users?: any[]
}

/**
 * Shared test data structure for reuse across tests
 * Created once in beforeAll() and reused across all tests for performance
 */
export interface SharedPDFTestData {
  // Voucher Books by type
  publishedBooks: any[]
  draftBooks: any[]

  // Quick access
  allBooks: any[]
  bookById: Map<string, any>
}

export interface SeedVoucherBooksOptions {
  generateDrafts?: boolean
  generatePublished?: boolean
  count?: number
  addPages?: boolean
  addAds?: boolean
  createdBy?: string // UUID of the user who created the voucher books
}

/**
 * Creates a VoucherServiceClient mock for testing
 * This prevents 502 errors by mocking external service calls
 */
export function createMockedVoucherServiceClient() {
  return createVoucherServiceClientMock()
}

/**
 * Creates test voucher books with proper relationships
 */
export async function seedTestVoucherBooks(
  prisma: PrismaClient,
  options: SeedVoucherBooksOptions = {},
): Promise<VoucherBookTestData> {
  const {
    generateDrafts = false,
    generatePublished = true,
    count = 3,
    addPages = false,
    addAds = false,
    createdBy,
  } = options

  // Get a test user if createdBy not provided
  let userId = createdBy

  if (!userId) {
    const testUser = await prisma.user.findFirst({
      where: { email: { contains: '@e2etest.com' } },
    })

    if (!testUser) {
      throw new Error('No test users found and no createdBy provided.')
    }
    userId = testUser.id
  }

  const voucherBooks: any[] = []

  for (let i = 0; i < count; i++) {
    // Create published book by default
    let status: 'draft' | 'published' = 'published'

    if (generateDrafts && generatePublished) {
      status = i % 2 === 0 ? 'published' : 'draft'
    } else if (generateDrafts) {
      status = 'draft'
    }

    const voucherBook = await prisma.voucherBook.create({
      data: {
        id: uuid(),
        title: `Test Voucher Book ${i + 1}`,
        year: new Date().getFullYear(),
        month: ((new Date().getMonth() + i) % 12) + 1,
        bookType: i % 2 === 0 ? 'monthly' : 'special_edition',
        totalPages: 24 + i * 8, // 24, 32, 40, etc.
        status,
        createdBy: userId,
        updatedBy: userId,
        // Add PDF URL for published books
        pdfUrl:
          status === 'published'
            ? `https://example.com/test-voucher-book-${i + 1}.pdf`
            : null,
        pdfGeneratedAt: status === 'published' ? new Date() : null,
        publishedAt: status === 'published' ? new Date() : null,
      },
    })

    // Add pages if requested
    if (addPages) {
      for (let pageNum = 1; pageNum <= voucherBook.totalPages; pageNum++) {
        await prisma.voucherBookPage.create({
          data: {
            id: uuid(),
            bookId: voucherBook.id,
            pageNumber: pageNum,
            layoutType: pageNum % 4 === 0 ? 'mixed' : 'standard',
            metadata: { content: `Page ${pageNum} content` },
          },
        })
      }
    }

    // Add ads if requested
    if (addAds && voucherBook.pages && voucherBook.pages.length > 0) {
      // Create an ad placement on the first page
      await prisma.adPlacement.create({
        data: {
          id: uuid(),
          pageId: voucherBook.pages[0].id,
          contentType: 'ad',
          position: 1,
          size: 'full',
          spacesUsed: 8,
          title: 'Sample Ad',
          description: 'Sample ad placement',
          createdBy: userId,
        },
      })
    }

    voucherBooks.push(voucherBook)
  }

  return {
    voucherBooks,
  }
}

/**
 * Creates shared test data for reuse across all tests
 * This is called once in beforeAll() to improve test performance
 */
export async function createSharedPDFTestData(
  prisma: PrismaClient,
): Promise<SharedPDFTestData> {
  // Get a test user for foreign key references
  const testUser = await prisma.user.findFirst({
    where: { email: { contains: '@e2etest.com' } },
  })

  if (!testUser) {
    throw new Error(
      'No test users found. Make sure authHelper.createAllTestUsers() was called first.',
    )
  }

  // Create published books
  const publishedBooksData = await seedTestVoucherBooks(prisma, {
    generatePublished: true,
    generateDrafts: false,
    count: 3,
    addPages: true,
    createdBy: testUser.id,
  })

  // Create draft books
  const draftBooksData = await seedTestVoucherBooks(prisma, {
    generatePublished: false,
    generateDrafts: true,
    count: 2,
    createdBy: testUser.id,
  })

  const allBooks = [
    ...publishedBooksData.voucherBooks,
    ...draftBooksData.voucherBooks,
  ]
  const bookById = new Map(allBooks.map((book) => [book.id, book]))

  return {
    publishedBooks: publishedBooksData.voucherBooks,
    draftBooks: draftBooksData.voucherBooks,
    allBooks,
    bookById,
  }
}

/**
 * Helper function to create a single test voucher book
 */
export async function createTestVoucherBook(
  prisma: PrismaClient,
  status: 'draft' | 'published' | 'ready_for_print' = 'published',
  title?: string,
  createdBy?: string,
  withPlacements = false,
): Promise<any> {
  // Get a test user if createdBy not provided
  let userId = createdBy

  if (!userId) {
    const testUser = await prisma.user.findFirst({
      where: { email: { contains: '@e2etest.com' } },
    })

    if (!testUser) {
      throw new Error('No test users found and no createdBy provided.')
    }
    userId = testUser.id
  }

  const voucherBook = await prisma.voucherBook.create({
    data: {
      id: uuid(),
      title: title || `Test Voucher Book`,
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      bookType: 'monthly',
      totalPages: 24,
      status,
      createdBy: userId,
      updatedBy: userId,
      // Add PDF URL for published books
      pdfUrl:
        status === 'published'
          ? 'https://example.com/test-voucher-book.pdf'
          : null,
      pdfGeneratedAt: status === 'published' ? new Date() : null,
      publishedAt: status === 'published' ? new Date() : null,
    },
  })

  // Create pages and placements if requested
  if (withPlacements) {
    const page = await prisma.voucherBookPage.create({
      data: {
        id: uuid(),
        book: {
          connect: { id: voucherBook.id },
        },
        pageNumber: 1,
        layoutType: 'standard',
      },
    })

    await prisma.adPlacement.create({
      data: {
        id: uuid(),
        page: {
          connect: { id: page.id },
        },
        createdByUser: {
          connect: { id: userId },
        },
        contentType: 'ad',
        position: 1,
        size: 'full',
        spacesUsed: 8,
        title: 'Sample Ad',
        description: 'Sample ad placement',
      },
    })
  }

  return voucherBook
}
