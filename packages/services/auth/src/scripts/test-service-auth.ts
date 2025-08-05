#!/usr/bin/env tsx

// Load environment variables first
import '@pika/environment'

import { SERVICE_API_KEY } from '@pika/environment'
import axios, { AxiosError } from 'axios'

// Service URLs
const USER_SERVICE_URL = 'http://localhost:5501'
const COMMUNICATION_SERVICE_URL = 'http://localhost:5507'

// Get actual API key from environment
const apiKey = process.env.SERVICE_API_KEY || SERVICE_API_KEY

// Helper to extract error details
function getErrorDetails(error: any): any {
  if (error instanceof AxiosError) {
    return {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    }
  }

  return error
}

async function testServiceAuthentication() {
  console.log('🔐 Testing Internal Service-to-Service Authentication')
  console.log('='.repeat(60))
  console.log(`SERVICE_API_KEY: ${apiKey ? '✅ Configured' : '❌ Missing!'}`)
  console.log(`Value: ${apiKey}`)
  console.log()

  // Test 1: User Service Internal Endpoint
  console.log('📍 Test 1: User Service Internal Endpoint')
  console.log('Testing: GET /internal/users/check-email/test@example.com')

  try {
    // First, try without auth (should fail)
    console.log('\n❌ Attempting without authentication...')
    try {
      await axios.get(
        `${USER_SERVICE_URL}/internal/users/check-email/test@example.com`,
      )
      console.log('❌ SECURITY ISSUE: Request succeeded without auth!')
    } catch (error) {
      const errorDetails = getErrorDetails(error)

      if (errorDetails.status === 401 || errorDetails.status === 403) {
        console.log('✅ Correctly rejected: Authentication required')
      } else {
        console.log(
          '❓ Unexpected error:',
          errorDetails.status,
          errorDetails.data,
        )
      }
    }

    // Now try with service auth
    console.log('\n✅ Attempting with service authentication...')

    const response = await axios.get(
      `${USER_SERVICE_URL}/internal/users/check-email/test@example.com`,
      {
        headers: {
          'x-api-key': apiKey,
          'x-service-name': 'test-script',
          'x-service-id': 'test-script-001',
        },
      },
    )

    console.log('✅ Success! Response:', response.data)
  } catch (error) {
    const errorDetails = getErrorDetails(error)

    console.log('❌ Failed with service auth:', errorDetails)
  }

  // Test 2: Communication Service Email Endpoint
  console.log('\n📍 Test 2: Communication Service Email Endpoint (Mixed Auth)')
  console.log('Testing: POST /emails/send (accepts both JWT and service auth)')

  try {
    const emailData = {
      to: 'test@example.com',
      subject: 'Test Email from Service Auth',
      body: 'This is a test email sent using service authentication.',
      templateId: 'test-template',
      templateParams: {
        name: 'Test User',
        action: 'testing service auth',
      },
    }

    console.log('\n✅ Attempting with service authentication...')

    const response = await axios.post(
      `${COMMUNICATION_SERVICE_URL}/emails/send`,
      emailData,
      {
        headers: {
          'x-api-key': apiKey,
          'x-service-name': 'auth-service',
          'x-service-id': 'auth-service-001',
          'Content-Type': 'application/json',
        },
      },
    )

    console.log('✅ Success! Email queued:', {
      id: response.data.id,
      status: response.data.status,
    })
  } catch (error) {
    const errorDetails = getErrorDetails(error)

    console.log('❌ Failed to send email:', errorDetails)
  }

  // Test 3: Communication Service Internal Endpoint
  console.log('\n📍 Test 3: Communication Service Internal Endpoint')
  console.log('Testing: POST /internal/emails/send')

  try {
    const emailData = {
      to: 'test@example.com',
      subject: 'Test Internal Email',
      body: 'This is a test email via internal endpoint.',
    }

    const response = await axios.post(
      `${COMMUNICATION_SERVICE_URL}/internal/emails/send`,
      emailData,
      {
        headers: {
          'x-api-key': apiKey,
          'x-service-name': 'auth-service',
          'x-service-id': 'auth-service-001',
          'Content-Type': 'application/json',
        },
      },
    )

    console.log('✅ Success! Internal email sent:', {
      id: response.data.id,
      status: response.data.status,
    })
  } catch (error) {
    const errorDetails = getErrorDetails(error)

    console.log('❌ Failed via internal endpoint:', errorDetails)
  }

  // Test 4: Invalid API Key
  console.log('\n📍 Test 4: Invalid API Key (Security Check)')

  try {
    await axios.get(
      `${USER_SERVICE_URL}/internal/users/check-email/test@example.com`,
      {
        headers: {
          'x-api-key': 'invalid-api-key-12345',
          'x-service-name': 'test-script',
          'x-service-id': 'test-script-001',
        },
      },
    )
    console.log('❌ SECURITY ISSUE: Invalid API key was accepted!')
  } catch (error) {
    const errorDetails = getErrorDetails(error)

    if (errorDetails.status === 401 || errorDetails.status === 403) {
      console.log('✅ Correctly rejected invalid API key')
    } else {
      console.log('❓ Unexpected error:', errorDetails)
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('Service Authentication Test Summary')
  console.log('='.repeat(60))
  console.log('\n✅ What should be working:')
  console.log('   • Internal endpoints require x-api-key header')
  console.log('   • Service name and ID headers are required')
  console.log('   • Invalid API keys are rejected')
  console.log('   • Communication service /emails/send accepts service auth')
  console.log('   • Internal routes under /internal/* are protected')

  console.log('\n📋 Headers required for service auth:')
  console.log('   • x-api-key: SERVICE_API_KEY from environment')
  console.log('   • x-service-name: Name of calling service')
  console.log('   • x-service-id: Unique service instance ID')

  console.log('\n🔧 Current SERVICE_API_KEY:', SERVICE_API_KEY || 'NOT SET!')
}

// Run the test
testServiceAuthentication().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
