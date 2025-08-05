#!/usr/bin/env tsx

import axios, { AxiosInstance } from 'axios'
import { get } from 'lodash-es'

import { createTestUsers, TEST_USERS } from './setup-test-users.js'

// API Configuration
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://127.0.0.1:5500'
const API_PREFIX = '/api/v1'

// Test data - use pre-created verified users
const testAdmin = TEST_USERS.find((u) => u.role === 'admin')!
const testCustomer = TEST_USERS.find(
  (u) => u.role === 'customer' && u.emailVerified,
)!

// Add timestamp to make categories unique
const timestamp = Date.now()

const testCategories = [
  {
    nameKey: `category.fitness.${timestamp}`,
    descriptionKey: 'category.fitness.description',
    icon: 'fitness',
    isActive: true,
    sortOrder: 1,
  },
  {
    nameKey: `category.wellness.${timestamp}`,
    descriptionKey: 'category.wellness.description',
    icon: 'wellness',
    isActive: true,
    sortOrder: 2,
  },
  {
    nameKey: `category.sports.${timestamp}`,
    descriptionKey: 'category.sports.description',
    icon: 'sports',
    isActive: true,
    sortOrder: 3,
  },
]

// Subcategories
const testSubcategories = [
  {
    nameKey: `category.fitness.gym.${timestamp}`,
    descriptionKey: 'category.fitness.gym.description',
    icon: 'gym',
    isActive: true,
    sortOrder: 1,
    // parentId will be set dynamically
  },
  {
    nameKey: `category.fitness.yoga.${timestamp}`,
    descriptionKey: 'category.fitness.yoga.description',
    icon: 'yoga',
    isActive: true,
    sortOrder: 2,
    // parentId will be set dynamically
  },
]

// Console colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

// Helper functions
const log = (message: string) => console.log(message)
const logStep = (step: number, title: string) =>
  log(`${colors.cyan}\n${colors.bright}Step ${step}: ${title}${colors.reset}`)
const logSuccess = (message: string) =>
  log(`${colors.green}✅ ${message}${colors.reset}`)
const logError = (message: string) =>
  log(`${colors.red}❌ ${message}${colors.reset}`)
const logInfo = (message: string) =>
  log(`${colors.blue}ℹ️  ${message}${colors.reset}`)
const logRequest = (method: string, path: string, data?: any) => {
  log(`${colors.yellow}\n🔄 ${method} ${path}${colors.reset}`)
  if (data) {
    log(
      `${colors.dim}Request body: ${JSON.stringify(data, null, 2)}${colors.reset}`,
    )
  }
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_GATEWAY_URL}${API_PREFIX}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request/response interceptors for debugging
api.interceptors.request.use((config) => {
  const startTime = Date.now()

  config.metadata = { startTime }

  return config
})

api.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata.startTime

    log(`${colors.green}Response ${response.status}:${colors.reset}`)
    log(`${colors.dim}${JSON.stringify(response.data, null, 2)}${colors.reset}`)
    log(`${colors.dim}⏱️  Duration: ${duration}ms${colors.reset}`)

    return response
  },
  (error) => {
    const duration = error.config?.metadata?.startTime
      ? Date.now() - error.config.metadata.startTime
      : 0

    log(`${colors.red}Response ${error.response?.status}:${colors.reset}`)
    log(
      `${colors.dim}${JSON.stringify(error.response?.data, null, 2)}${colors.reset}`,
    )
    if (duration) {
      log(`${colors.dim}⏱️  Duration: ${duration}ms${colors.reset}`)
    }

    return Promise.reject(error)
  },
)

// Auth functions
async function loginAsAdmin(): Promise<string> {
  logInfo('Logging in as admin...')

  try {
    const response = await api.post('/auth/token', {
      grantType: 'password',
      username: testAdmin.email,
      password: testAdmin.password,
    })

    logSuccess('Admin logged in successfully')

    return response.data.accessToken
  } catch (error: any) {
    logError(
      `Admin login failed: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

async function loginAsCustomer(): Promise<string> {
  logInfo('Logging in as customer...')

  try {
    const response = await api.post('/auth/token', {
      grantType: 'password',
      username: testCustomer.email,
      password: testCustomer.password,
    })

    logSuccess('Customer logged in successfully')

    return response.data.accessToken
  } catch (error: any) {
    logError(
      `Customer login failed: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

// Category management functions (Admin)
async function createCategory(
  token: string,
  categoryData: any,
): Promise<string> {
  logRequest('POST', '/admin/categories', categoryData)

  try {
    const response = await api.post('/admin/categories', categoryData, {
      headers: { Authorization: `Bearer ${token}` },
    })

    logSuccess(`Category created: ${response.data.id}`)

    return response.data.id
  } catch (error: any) {
    logError(
      `Category creation failed: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

async function updateCategory(
  token: string,
  categoryId: string,
  updateData: any,
): Promise<void> {
  logRequest('PATCH', `/admin/categories/${categoryId}`, updateData)

  try {
    await api.patch(`/admin/categories/${categoryId}`, updateData, {
      headers: { Authorization: `Bearer ${token}` },
    })

    logSuccess('Category updated successfully')
  } catch (error: any) {
    logError(
      `Category update failed: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

async function toggleCategoryActivation(
  token: string,
  categoryId: string,
  isActive: boolean,
): Promise<void> {
  logRequest('POST', `/admin/categories/${categoryId}/toggle-status`, {
    isActive,
  })

  try {
    await api.post(
      `/admin/categories/${categoryId}/toggle-status`,
      { isActive },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )

    logSuccess(
      `Category ${isActive ? 'activated' : 'deactivated'} successfully`,
    )
  } catch (error: any) {
    logError(
      `Category activation toggle failed: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

async function deleteCategory(
  token: string,
  categoryId: string,
): Promise<void> {
  logRequest('DELETE', `/admin/categories/${categoryId}`)

  try {
    await api.delete(`/admin/categories/${categoryId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    logSuccess('Category deleted successfully')
  } catch (error: any) {
    logError(
      `Category deletion failed: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

// Category browsing functions (Public)
async function listPublicCategories(token?: string): Promise<void> {
  logRequest('GET', '/categories')

  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const response = await api.get('/categories', { headers })

    logSuccess(`Found ${response.data.data.length} categories`)
    logInfo(`Total categories: ${response.data.pagination.total}`)
  } catch (error: any) {
    logError(
      `Failed to list categories: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

async function getCategoryHierarchy(token: string): Promise<void> {
  logRequest('GET', '/categories/hierarchy')

  try {
    const response = await api.get('/categories/hierarchy', {
      headers: { Authorization: `Bearer ${token}` },
    })

    logSuccess(
      `Retrieved category hierarchy with ${response.data.data.length} root categories`,
    )
  } catch (error: any) {
    logError(
      `Failed to get category hierarchy: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

async function getCategoryPath(
  categoryId: string,
  token: string,
): Promise<void> {
  logRequest('GET', `/categories/${categoryId}/path`)

  try {
    const response = await api.get(`/categories/${categoryId}/path`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    logSuccess(
      `Retrieved category path with ${response.data.data.length} levels`,
    )
  } catch (error: any) {
    logError(
      `Failed to get category path: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

// Main flow
async function runCategoryFlow() {
  log(`\n${colors.bright}🚀 Starting Category Management Flow${colors.reset}`)
  log(`API Gateway URL: ${API_GATEWAY_URL}`)

  let adminToken: string = ''
  let customerToken: string = ''

  const createdCategoryIds: string[] = []

  try {
    // Ensure test users exist
    log(`\n${colors.bright}=== Setup: Ensuring Test Users ===${colors.reset}`)
    await createTestUsers()

    // Clean up any existing test categories
    logInfo('Cleaning up existing test categories...')
    adminToken = await loginAsAdmin()

    try {
      const response = await api.get('/admin/categories?limit=100', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      const existingCategories = response.data.data.filter(
        (cat: any) =>
          cat.nameKey.startsWith('category.fitness') ||
          cat.nameKey.startsWith('category.wellness') ||
          cat.nameKey.startsWith('category.sports'),
      )

      // Sort by level descending to delete children first
      existingCategories.sort(
        (a: any, b: any) => (b.level || 1) - (a.level || 1),
      )

      for (const cat of existingCategories) {
        try {
          await deleteCategory(adminToken, cat.id)
          logInfo(`Cleaned up existing category: ${cat.nameKey}`)
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }

    // Phase 1: Admin Category Management
    log(
      `\n${colors.bright}=== Phase 1: Admin Category Management ===${colors.reset}`,
    )

    logStep(1, 'Admin Authentication')
    adminToken = await loginAsAdmin()

    logStep(2, 'Create Parent Categories')

    for (const category of testCategories) {
      const categoryId = await createCategory(adminToken, category)

      createdCategoryIds.push(categoryId)

      // Create subcategories for the first category
      if (createdCategoryIds.length === 1) {
        logInfo('Creating subcategories...')

        for (const subcategory of testSubcategories) {
          const subcategoryData = { ...subcategory, parentId: categoryId }
          const subcategoryId = await createCategory(
            adminToken,
            subcategoryData,
          )

          createdCategoryIds.push(subcategoryId)
        }
      }
    }

    logStep(3, 'Update Category')
    if (createdCategoryIds.length > 0) {
      await updateCategory(adminToken, createdCategoryIds[0], {
        descriptionKey: 'category.fitness.updated.description',
        sortOrder: 10,
      })
    }

    logStep(4, 'Toggle Category Activation')
    if (createdCategoryIds.length > 1) {
      await toggleCategoryActivation(adminToken, createdCategoryIds[1], false)
    }

    // Phase 2: Public Category Browsing
    log(
      `\n${colors.bright}=== Phase 2: Public Category Browsing ===${colors.reset}`,
    )

    logStep(5, 'Customer Login')
    customerToken = await loginAsCustomer()

    logStep(6, 'Public Category List (Authenticated Customer)')
    await listPublicCategories(customerToken)

    logStep(7, 'Category Hierarchy')
    await getCategoryHierarchy(customerToken)

    logStep(8, 'Category Path')
    if (createdCategoryIds.length > 3) {
      // Get path for a subcategory
      await getCategoryPath(createdCategoryIds[3], customerToken)
    }

    // Phase 3: Cleanup
    log(`\n${colors.bright}=== Phase 3: Cleanup ===${colors.reset}`)

    logStep(9, 'Delete Test Categories')

    // Delete in reverse order (children first)
    for (let i = createdCategoryIds.length - 1; i >= 0; i--) {
      try {
        const categoryId = get(createdCategoryIds, i)

        if (categoryId) {
          await deleteCategory(adminToken, categoryId)
        }
      } catch (error) {
        // Ignore errors during cleanup
      }
    }

    log(
      `\n${colors.bright}${colors.green}✅ Category Flow Completed Successfully!${colors.reset}`,
    )
    log(`\nFlow Summary:`)
    log(`- Created ${createdCategoryIds.length} categories (parent and child)`)
    log(`- Demonstrated admin CRUD operations`)
    log(`- Showed public browsing capabilities`)
    log(`- Tested hierarchical structure`)
  } catch (error: any) {
    log(
      `\n${colors.bright}${colors.red}❌ Category Flow Failed!${colors.reset}`,
    )
    if (error.response) {
      log(`\nError details:`)
      log(`Status: ${error.response.status}`)
      log(`Message: ${error.response.data?.message || error.message}`)
    } else {
      log(`\nError: ${error.message}`)
    }
    process.exit(1)
  }
}

// Run the flow
runCategoryFlow().catch((error) => {
  logError(`Unexpected error: ${error.message}`)
  process.exit(1)
})
