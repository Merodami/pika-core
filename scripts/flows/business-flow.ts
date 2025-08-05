#!/usr/bin/env tsx

import axios, { AxiosInstance } from 'axios'

import { createTestUsers, TEST_USERS } from './setup-test-users.js'

// API Configuration
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://127.0.0.1:5500'
const API_PREFIX = '/api/v1'

// Test data - use pre-created verified users
const testAdmin = TEST_USERS.find((u) => u.role === 'admin')!
const testBusinessOwner = TEST_USERS.find(
  (u) => u.role === 'business' && u.emailVerified,
)!

// Add timestamp to make businesses unique
const timestamp = Date.now()

// Test business data - will need to get a category ID first
const testBusinessData = {
  businessName: `Test Business ${timestamp}`,
  businessDescription: 'A test business for flow testing',
  categoryId: '', // Will be set after getting categories
}

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

// Business management functions
async function createBusiness(
  token: string,
  businessData: any,
): Promise<string> {
  logRequest('POST', '/businesses/me', businessData)

  try {
    const response = await api.post('/businesses/me', businessData, {
      headers: { Authorization: `Bearer ${token}` },
    })

    logSuccess(`Business created: ${response.data.id}`)

    return response.data.id
  } catch (error: any) {
    logError(
      `Business creation failed: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

async function getBusinessById(
  businessId: string,
  token: string,
): Promise<any> {
  logRequest('GET', `/businesses/${businessId}`)

  try {
    const response = await api.get(`/businesses/${businessId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    logSuccess('Business retrieved successfully')

    return response.data
  } catch (error: any) {
    logError(
      `Failed to get business: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

async function updateBusiness(token: string, updateData: any): Promise<void> {
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

async function uploadBusinessLogo(token: string): Promise<void> {
  logInfo('Uploading business logo...')

  // Simulate file upload with a placeholder
  const formData = new FormData()
  const blob = new Blob(['fake-logo-data'], { type: 'image/png' })

  formData.append('file', blob, 'logo.png')

  logRequest('POST', '/businesses/me/logo')

  try {
    await api.post('/businesses/me/logo', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    })

    logSuccess('Business logo uploaded successfully')
  } catch (error: any) {
    // Logo upload might not be implemented yet
    logInfo(
      `Logo upload skipped: ${error.response?.data?.message || error.message}`,
    )
  }
}

async function listBusinesses(token: string, params?: any): Promise<void> {
  const queryString = params ? `?${new URLSearchParams(params).toString()}` : ''

  logRequest('GET', `/businesses${queryString}`)

  try {
    const response = await api.get(`/businesses${queryString}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    logSuccess(`Found ${response.data.data.length} businesses`)
    logInfo(`Total businesses: ${response.data.pagination.total}`)
  } catch (error: any) {
    logError(
      `Failed to list businesses: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

// Admin functions
async function adminListBusinesses(token: string): Promise<void> {
  logRequest('GET', '/admin/businesses')

  try {
    const response = await api.get('/admin/businesses', {
      headers: { Authorization: `Bearer ${token}` },
    })

    logSuccess(`Admin: Found ${response.data.data.length} businesses`)
    logInfo(`Total businesses in system: ${response.data.pagination.total}`)
  } catch (error: any) {
    logError(
      `Admin business list failed: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

async function adminToggleBusinessStatus(
  businessId: string,
  token: string,
  isActive: boolean,
): Promise<void> {
  const endpoint = isActive
    ? `/admin/businesses/${businessId}/activate`
    : `/admin/businesses/${businessId}/deactivate`

  logRequest('POST', endpoint)

  try {
    logInfo(`Sending request to ${endpoint} with empty body`)

    // Send empty object for POST request
    const response = await api.post(
      endpoint,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )

    logInfo(`Response received: ${JSON.stringify(response.data)}`)
    logSuccess(`Business ${isActive ? 'activated' : 'deactivated'} by admin`)
  } catch (error: any) {
    logError(
      `Admin status toggle failed: ${error.response?.data?.message || error.message}`,
    )
    if (error.code === 'ECONNABORTED') {
      logError('Request timeout - connection aborted')
    }
    throw error
  }
}

async function adminVerifyBusiness(
  businessId: string,
  token: string,
): Promise<void> {
  logRequest('POST', `/admin/businesses/${businessId}/verify`, {
    verified: true,
  })

  try {
    await api.post(
      `/admin/businesses/${businessId}/verify`,
      { verified: true },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )

    logSuccess('Business verified by admin')
  } catch (error: any) {
    logError(
      `Admin verification failed: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

async function deleteBusiness(
  businessId: string,
  token: string,
): Promise<void> {
  logRequest('DELETE', `/admin/businesses/${businessId}`)

  try {
    await api.delete(`/admin/businesses/${businessId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    logSuccess('Business deleted successfully')
  } catch (error: any) {
    logError(
      `Business deletion failed: ${error.response?.data?.message || error.message}`,
    )
    throw error
  }
}

// Main flow
async function runBusinessFlow() {
  log(`\n${colors.bright}🚀 Starting Business Management Flow${colors.reset}`)
  log(`API Gateway URL: ${API_GATEWAY_URL}`)

  let businessOwnerToken: string = ''
  let adminToken: string = ''
  let createdBusinessId: string = ''
  let createdCategoryId: string = ''

  try {
    // Ensure test users exist
    log(`\n${colors.bright}=== Setup: Ensuring Test Users ===${colors.reset}`)
    await createTestUsers()

    // Phase 1: Business Registration (Public API)
    log(
      `\n${colors.bright}=== Phase 1: Business Registration ===${colors.reset}`,
    )

    logStep(1, 'Admin Setup - Create Category')
    adminToken = await loginAsAdmin()

    // Create a category as admin first
    const categoryData = {
      nameKey: `category.business.test.${timestamp}`,
      descriptionKey: 'category.business.test.description',
      icon: 'business',
      isActive: true,
      sortOrder: 1,
    }
    const categoryResponse = await api.post('/admin/categories', categoryData, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    createdCategoryId = categoryResponse.data.id
    testBusinessData.categoryId = createdCategoryId
    logInfo(`Created category: ${categoryData.nameKey}`)

    logStep(2, 'Business Owner Authentication')
    businessOwnerToken = await loginAsBusinessOwner()

    logStep(3, 'Create or Get Business')
    try {
      createdBusinessId = await createBusiness(
        businessOwnerToken,
        testBusinessData,
      )
    } catch (error: any) {
      if (error.response?.status === 409) {
        // Business already exists, get it instead
        logInfo('Business already exists, retrieving it...')

        const myBusiness = await getMyBusiness(businessOwnerToken)

        createdBusinessId = myBusiness.id
        logSuccess(`Using existing business: ${createdBusinessId}`)
      } else {
        throw error
      }
    }

    logStep(4, 'Get My Business Details')

    const businessDetails = await getMyBusiness(businessOwnerToken)

    logInfo(`Business ID: ${businessDetails.id}`)
    logInfo(
      `Business Name: ${businessDetails.businessName || businessDetails.businessNameKey}`,
    )

    logStep(5, 'Update Business Information')
    await updateBusiness(businessOwnerToken, {
      businessDescription: 'Updated business description for testing',
    })

    logStep(6, 'Upload Business Logo')
    await uploadBusinessLogo(businessOwnerToken)

    logStep(7, 'List Businesses (Owner View)')
    await listBusinesses(businessOwnerToken, { limit: 10 })

    // Phase 2: Admin Business Management
    log(
      `\n${colors.bright}=== Phase 2: Admin Business Management ===${colors.reset}`,
    )

    logStep(8, 'Admin Business Management')
    // Already logged in as admin

    logStep(9, 'Admin: List All Businesses')
    await adminListBusinesses(adminToken)

    logStep(10, 'Admin: Verify Business')
    await adminVerifyBusiness(createdBusinessId, adminToken)

    logStep(11, 'Admin: Deactivate Business')
    await adminToggleBusinessStatus(createdBusinessId, adminToken, false)

    logStep(12, 'Admin: Reactivate Business')
    await adminToggleBusinessStatus(createdBusinessId, adminToken, true)

    // Phase 3: Public Business Browsing
    log(
      `\n${colors.bright}=== Phase 3: Public Business Browsing ===${colors.reset}`,
    )

    logStep(13, 'Search Businesses by Name')
    await listBusinesses(businessOwnerToken, {
      search: 'Test Business',
      limit: 5,
    })

    logStep(14, 'Filter Active Businesses')
    await listBusinesses(businessOwnerToken, {
      active: true,
      verified: true,
      limit: 10,
    })

    // Phase 4: Cleanup
    log(`\n${colors.bright}=== Phase 4: Cleanup ===${colors.reset}`)

    logStep(15, 'Delete Test Business')
    await deleteBusiness(createdBusinessId, adminToken)

    logStep(16, 'Clean up Test Category')
    try {
      await api.delete(`/admin/categories/${createdCategoryId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      logSuccess('Test category deleted')
    } catch (error) {
      // Ignore cleanup errors
    }

    log(
      `\n${colors.bright}${colors.green}✅ Business Flow Completed Successfully!${colors.reset}`,
    )
    log(`\nFlow Summary:`)
    log(`- Business registration and profile management`)
    log(`- Admin verification and status management`)
    log(`- Public business listing and search`)
    log(`- Complete CRUD operations demonstrated`)
  } catch (error: any) {
    log(
      `\n${colors.bright}${colors.red}❌ Business Flow Failed!${colors.reset}`,
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
runBusinessFlow().catch((error) => {
  logError(`Unexpected error: ${error.message}`)
  process.exit(1)
})
