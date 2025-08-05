import {
  AUTH_API_URL,
  BUSINESS_API_URL,
  CATEGORY_API_URL,
  COMMUNICATION_API_URL,
  FILE_STORAGE_API_URL,
  PAYMENT_API_URL,
  PDF_API_URL,
  SUBSCRIPTION_API_URL,
  SUPPORT_API_URL,
  USER_API_URL,
  VOUCHER_API_URL,
} from '@pika/environment'

import type { ServiceConfig } from '../types.js'

export const publicRoutes: ServiceConfig[] = [
  {
    name: 'auth',
    prefix: '/api/v1/auth',
    upstream: AUTH_API_URL,
  },
  {
    name: 'users',
    prefix: '/api/v1/users',
    upstream: USER_API_URL,
  },
  {
    name: 'businesses',
    prefix: '/api/v1/businesses',
    upstream: BUSINESS_API_URL,
  },
  {
    name: 'categories',
    prefix: '/api/v1/categories',
    upstream: CATEGORY_API_URL,
  },
  {
    name: 'payments',
    prefix: '/api/v1/payments',
    upstream: PAYMENT_API_URL,
  },
  {
    name: 'credits',
    prefix: '/api/v1/credits',
    upstream: PAYMENT_API_URL,
  },
  {
    name: 'subscriptions',
    prefix: '/api/v1/subscriptions',
    upstream: SUBSCRIPTION_API_URL,
  },
  {
    name: 'memberships',
    prefix: '/api/v1/memberships',
    upstream: SUBSCRIPTION_API_URL,
  },
  {
    name: 'communications',
    prefix: '/api/v1/communications',
    upstream: COMMUNICATION_API_URL,
  },
  {
    name: 'notifications',
    prefix: '/api/v1/notifications',
    upstream: COMMUNICATION_API_URL,
  },
  {
    name: 'problems',
    prefix: '/api/v1/problems',
    upstream: SUPPORT_API_URL,
  },
  {
    name: 'support',
    prefix: '/api/v1/support',
    upstream: SUPPORT_API_URL,
  },
  {
    name: 'files',
    prefix: '/api/v1/files',
    upstream: FILE_STORAGE_API_URL,
  },
  {
    name: 'uploads',
    prefix: '/api/v1/uploads',
    upstream: FILE_STORAGE_API_URL,
  },
  {
    name: 'pdf',
    prefix: '/api/v1/pdf',
    upstream: PDF_API_URL,
  },
  {
    name: 'vouchers',
    prefix: '/api/v1/vouchers',
    upstream: VOUCHER_API_URL,
  },
]
