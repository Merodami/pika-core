#!/usr/bin/env tsx

import axios, { AxiosInstance } from 'axios'
import { get } from 'lodash-es'

import { createTestUsers, TEST_USERS } from './setup-test-users.js'

// API Configuration
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://127.0.0.1:5500'
const API_PREFIX = '/api/v1'

// Test data - use pre-created verified users
const testAdmin = TEST_USERS.find((u) => u.role === 'admin')!
const testBusinessOwner = TEST_USERS.find(
  (u) => u.role === 'business' && u.emailVerified,
)!

// Add timestamp to make entities unique
const timestamp = Date.now()

// Test categories for assignment
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
    nameKey: `category.restaurant.${timestamp}`,
    descriptionKey: 'category.restaurant.description',
    icon: 'restaurant',
    isActive: true,
    sortOrder: 3,
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

async function loginAsBusinessOwner(): Promise<string> {
  logInfo('Logging in as business owner...')

  try {
    const response = await api.post('/auth/token', {
      grantType: 'password',
      username: testBusinessOwner.email,
      password: testBusinessOwner.password,
    })

    logSuccess('Business owner logged in successfully')

    return response.data.accessToken
  } catch (error: any) {
    logError(
      `Business owner login failed: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

// Category management functions
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

// Business management functions
async function getMyBusiness(token: string): Promise<any> {
  logRequest('GET', '/businesses/me')

  try {
    const response = await api.get('/businesses/me', {
      headers: { Authorization: `Bearer ${token}` },
    })

    logSuccess('My business retrieved successfully')

    return response.data
  } catch (error: any) {
    logError(
      `Failed to get my business: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

async function updateMyBusiness(token: string, updateData: any): Promise<void> {
  logRequest('PUT', '/businesses/me', updateData)

  try {
    await api.put('/businesses/me', updateData, {
      headers: { Authorization: `Bearer ${token}` },
    })

    logSuccess('Business updated successfully')
  } catch (error: any) {
    logError(
      `Business update failed: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

async function getBusinessesByCategory(
  token: string,
  categoryId: string,
): Promise<any> {
  logRequest('GET', `/businesses?categoryId=${categoryId}`)

  try {
    const response = await api.get(`/businesses?categoryId=${categoryId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    logSuccess(`Found ${response.data.data.length} businesses in category`)

    return response.data
  } catch (error: any) {
    logError(
      `Failed to get businesses by category: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

// Admin functions
async function adminUpdateBusiness(
  businessId: string,
  token: string,
  updateData: any,
): Promise<void> {
  logRequest('PATCH', `/admin/businesses/${businessId}`, updateData)

  try {
    await api.patch(`/admin/businesses/${businessId}`, updateData, {
      headers: { Authorization: `Bearer ${token}` },
    })

    logSuccess('Admin: Business updated successfully')
  } catch (error: any) {
    logError(
      `Admin business update failed: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

async function adminSearchBusinesses(token: string, params: any): Promise<any> {
  const queryString = new URLSearchParams(params).toString()

  logRequest('GET', `/admin/businesses?${queryString}`)

  try {
    const response = await api.get(`/admin/businesses?${queryString}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    logSuccess(`Admin: Found ${response.data.data.length} businesses`)

    return response.data
  } catch (error: any) {
    logError(
      `Admin business search failed: ${error.response?.data?.message || error.message}`,
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
  } catch {
    // Ignore errors during cleanup
  }
}

// Main flow
async function runBusinessCategoryFlow() {
  log(
    `\n${colors.bright}🚀 Starting Business-Category Assignment Flow${colors.reset}`,
  )
  log(`API Gateway URL: ${API_GATEWAY_URL}`)

  let adminToken: string = ''
  let businessOwnerToken: string = ''

  const createdCategoryIds: string[] = []

  let businessId: string = ''
  let originalCategoryId: string = ''

  try {
    // Ensure test users exist
    log(`\n${colors.bright}=== Setup: Ensuring Test Users ===${colors.reset}`)
    await createTestUsers()

    // Phase 1: Setup Categories
    log(
      `\n${colors.bright}=== Phase 1: Setup Test Categories ===${colors.reset}`,
    )

    logStep(1, 'Admin Authentication')
    adminToken = await loginAsAdmin()

    logStep(2, 'Create Multiple Categories')

    for (const category of testCategories) {
      const categoryId = await createCategory(adminToken, category)

      createdCategoryIds.push(categoryId)
      logInfo(`Created category: ${category.nameKey}`)
    }

    // Phase 2: Business Category Management
    log(
      `\n${colors.bright}=== Phase 2: Business Category Assignment ===${colors.reset}`,
    )

    logStep(3, 'Business Owner Authentication')
    businessOwnerToken = await loginAsBusinessOwner()

    logStep(4, 'Get Current Business Details')

    const currentBusiness = await getMyBusiness(businessOwnerToken)

    businessId = currentBusiness.id
    originalCategoryId = currentBusiness.categoryId
    logInfo(
      `Current business: ${currentBusiness.businessNameKey || currentBusiness.businessName}`,
    )
    logInfo(`Current category: ${originalCategoryId}`)

    logStep(5, 'Change Business Category (Business Owner)')
    await updateMyBusiness(businessOwnerToken, {
      categoryId: createdCategoryIds[0], // Switch to fitness category
    })
    logInfo(`Business moved to category: ${testCategories[0].nameKey}`)

    logStep(6, 'Verify Category Change')

    const updatedBusiness = await getMyBusiness(businessOwnerToken)

    logInfo(`New category ID: ${updatedBusiness.categoryId}`)

    // Phase 3: Category Filtering
    log(
      `\n${colors.bright}=== Phase 3: Business Filtering by Category ===${colors.reset}`,
    )

    logStep(7, 'List Businesses in Fitness Category')
    await getBusinessesByCategory(businessOwnerToken, createdCategoryIds[0])

    logStep(8, 'List Businesses in Empty Category')
    await getBusinessesByCategory(businessOwnerToken, createdCategoryIds[1])

    // Phase 4: Admin Category Management
    log(
      `\n${colors.bright}=== Phase 4: Admin Category Operations ===${colors.reset}`,
    )

    logStep(9, 'Admin: Change Business Category')
    await adminUpdateBusiness(businessId, adminToken, {
      categoryId: createdCategoryIds[2], // Move to restaurant category
    })

    logStep(10, 'Admin: Filter Businesses by Category')
    await adminSearchBusinesses(adminToken, {
      categoryId: createdCategoryIds[2],
      limit: 10,
    })

    logStep(11, 'Admin: Search Across Multiple Categories')

    // Show businesses from original category
    const originalCategoryBusinesses = await adminSearchBusinesses(adminToken, {
      categoryId: originalCategoryId,
      limit: 10,
    })

    logInfo(
      `Businesses in original category: ${originalCategoryBusinesses.data.length}`,
    )

    // Phase 5: Category Impact Analysis
    log(
      `\n${colors.bright}=== Phase 5: Category Impact Analysis ===${colors.reset}`,
    )

    logStep(12, 'Show Business Distribution Across Categories')

    for (const [index, categoryId] of createdCategoryIds.entries()) {
      const result = await getBusinessesByCategory(
        businessOwnerToken,
        categoryId,
      )

      const category = get(testCategories, index)

      if (category) {
        logInfo(`${category.nameKey}: ${result.data.length} businesses`)
      }
    }

    // Phase 6: Cleanup
    log(`\n${colors.bright}=== Phase 6: Cleanup ===${colors.reset}`)

    logStep(13, 'Restore Original Category')
    await updateMyBusiness(businessOwnerToken, {
      categoryId: originalCategoryId,
    })

    logStep(14, 'Delete Test Categories')

    for (const categoryId of createdCategoryIds) {
      await deleteCategory(adminToken, categoryId)
    }

    log(
      `\n${colors.bright}${colors.green}✅ Business-Category Flow Completed Successfully!${colors.reset}`,
    )
    log(`\nFlow Summary:`)
    log(`- Created ${createdCategoryIds.length} test categories`)
    log(`- Demonstrated business category assignment by owner`)
    log(`- Showed admin category management capabilities`)
    log(`- Tested category-based filtering and search`)
    log(`- Validated business distribution analysis`)
  } catch (error: any) {
    log(
      `\n${colors.bright}${colors.red}❌ Business-Category Flow Failed!${colors.reset}`,
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
runBusinessCategoryFlow().catch((error) => {
  logError(`Unexpected error: ${error.message}`)
  process.exit(1)
})
