import {
  BUSINESS_API_URL,
  CATEGORY_API_URL,
  COMMUNICATION_API_URL,
  FILE_STORAGE_API_URL,
  PAYMENT_API_URL,
  SUBSCRIPTION_API_URL,
  SUPPORT_API_URL,
  USER_API_URL,
  VOUCHER_API_URL,
} from '@pika/environment'

import type { ServiceConfig } from '../types.js'

export const adminRoutes: ServiceConfig[] = [
  {
    name: 'admin/users',
    prefix: '/api/v1/admin/users',
    upstream: USER_API_URL,
  },
  {
    name: 'admin/businesses',
    prefix: '/api/v1/admin/businesses',
    upstream: BUSINESS_API_URL,
  },
  {
    name: 'admin/categories',
    prefix: '/api/v1/admin/categories',
    upstream: CATEGORY_API_URL,
  },
  {
    name: 'admin/payments',
    prefix: '/api/v1/admin/payments',
    upstream: PAYMENT_API_URL,
  },
  {
    name: 'admin/subscriptions',
    prefix: '/api/v1/admin/subscriptions',
    upstream: SUBSCRIPTION_API_URL,
  },
  {
    name: 'admin/communications',
    prefix: '/api/v1/admin/communications',
    upstream: COMMUNICATION_API_URL,
  },
  {
    name: 'admin/support',
    prefix: '/api/v1/admin/support',
    upstream: SUPPORT_API_URL,
  },
  {
    name: 'admin/files',
    prefix: '/api/v1/admin/files',
    upstream: FILE_STORAGE_API_URL,
  },
  {
    name: 'admin/vouchers',
    prefix: '/api/v1/admin/vouchers',
    upstream: VOUCHER_API_URL,
  },
]
