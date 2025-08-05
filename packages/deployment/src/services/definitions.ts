import { createAuthServer } from '@pika/auth-service'
import { createBusinessServer } from '@pika/business'
import { createCategoryServer } from '@pika/category'
import { createCommunicationServer } from '@pika/communication'
import { createPaymentServer } from '@pika/payment'
import { createPDFServer } from '@pika/pdf'
import { createStorageServer } from '@pika/storage'
import { createSubscriptionServer } from '@pika/subscription'
import { createSupportServer } from '@pika/support'
import {
  createTranslationResolver,
  createTranslationService,
  TranslationClient,
} from '@pika/translation'
import { createUserServer } from '@pika/user'
import { createVoucherServer } from '@pika/voucher-service'

import type { ServiceDefinition, ServiceDependencies } from '../types/index.js'

export function getServiceDefinitions(): ServiceDefinition[] {
  return [
    {
      name: 'auth',
      port: 5501,
      basePath: '/auth',
      healthCheck: '/health',
      createApp: async (deps: ServiceDependencies) => {
        const app = await createAuthServer({
          port: 5501,
          cacheService: deps.cache,
          userServiceClient: deps.services?.user,
          communicationClient: deps.services?.communication,
        })

        return app
      },
    },
    {
      name: 'user',
      port: 5502,
      basePath: '/users',
      healthCheck: '/health',
      createApp: async (deps: ServiceDependencies) => {
        const app = await createUserServer({
          prisma: deps.prisma,
          cacheService: deps.cache,
          fileStorage: deps.services?.fileStorage,
          communicationClient: deps.services?.communication,
        })

        return app
      },
    },
    {
      name: 'business',
      port: 5511,
      basePath: '/businesses',
      healthCheck: '/health',
      createApp: async (deps: ServiceDependencies) => {
        // Create translation service and client with proper dependencies
        const translationService = createTranslationService(
          deps.prisma,
          deps.cache as any,
        )
        const translationClient = new TranslationClient(translationService)

        const app = await createBusinessServer({
          prisma: deps.prisma,
          cacheService: deps.cache,
          translationClient,
        })

        return app
      },
    },
    {
      name: 'category',
      port: 5512,
      basePath: '/categories',
      healthCheck: '/health',
      createApp: async (deps: ServiceDependencies) => {
        // Create translation service and client with proper dependencies
        const translationService = createTranslationService(
          deps.prisma,
          deps.cache as any,
        )
        const translationClient = new TranslationClient(translationService)

        const { app } = await createCategoryServer({
          prisma: deps.prisma,
          cacheService: deps.cache,
          translationClient,
        })

        return app
      },
    },
    {
      name: 'payment',
      port: 5505,
      basePath: '/payments',
      healthCheck: '/health',
      createApp: async (deps: ServiceDependencies) => {
        const { app } = await createPaymentServer({
          prisma: deps.prisma,
          cacheService: deps.cache,
        })

        return app
      },
    },
    {
      name: 'subscription',
      port: 5506,
      basePath: '/subscriptions',
      healthCheck: '/health',
      createApp: async (deps: ServiceDependencies) => {
        const { app } = await createSubscriptionServer({
          prisma: deps.prisma,
          cacheService: deps.cache,
          paymentClient: deps.services?.payment,
        })

        return app
      },
    },
    {
      name: 'communication',
      port: 5507,
      basePath: '/communications',
      healthCheck: '/health',
      createApp: async (deps: ServiceDependencies) => {
        const app = await createCommunicationServer({
          port: 5507,
          prisma: deps.prisma,
          cacheService: deps.cache,
          emailConfig: {
            region: 'us-east-1',
            fromEmail: process.env.EMAIL_FROM || 'noreply@pika.com',
            fromName: 'Pika',
          },
        })

        return app
      },
    },
    {
      name: 'support',
      port: 5508,
      basePath: '/support',
      healthCheck: '/health',
      createApp: async (deps: ServiceDependencies) => {
        const { app } = await createSupportServer({
          port: 5508,
          prisma: deps.prisma,
          cacheService: deps.cache,
        })

        return app
      },
    },
    {
      name: 'storage',
      port: 5510,
      basePath: '/storage',
      healthCheck: '/health',
      createApp: async (deps: ServiceDependencies) => {
        const app = await createStorageServer({
          port: 5510,
          prisma: deps.prisma,
          cacheService: deps.cache,
          storageConfig: {
            // For Vercel deployment, use console provider for local development
            // This logs file operations instead of actually storing files
            region: process.env.STORAGE_REGION || 'us-east-1',
            bucketName: process.env.STORAGE_BUCKET || 'pika-storage',
            accessKeyId: process.env.STORAGE_ACCESS_KEY,
            secretAccessKey: process.env.STORAGE_SECRET_KEY,
            endpoint: process.env.STORAGE_ENDPOINT,
          },
        })

        return app
      },
    },
    {
      name: 'pdf',
      port: 5513,
      basePath: '/pdf',
      healthCheck: '/health',
      createApp: async (deps: ServiceDependencies) => {
        const app = await createPDFServer({
          prisma: deps.prisma,
          cacheService: deps.cache,
        })

        return app
      },
    },
    {
      name: 'voucher',
      port: 5514,
      basePath: '/vouchers',
      healthCheck: '/health',
      createApp: async (deps: ServiceDependencies) => {
        // Create translation service and client with proper dependencies
        const translationService = createTranslationService(
          deps.prisma,
          deps.cache as any,
        )
        const translationClient = new TranslationClient(translationService)
        const translationResolver = createTranslationResolver(translationClient)

        // Use the storage service client instead of direct file storage
        // This allows the storage service to handle the backend configuration
        const fileStorage = deps.services?.storage || {
          saveFile: async (file: any) => ({
            url: `/storage/files/${Date.now()}-${file.filename}`,
            size: file.size || 0,
            mimetype: file.mimetype || 'application/octet-stream',
            originalFilename: file.filename || 'unknown',
            filename: `${Date.now()}-${file.filename}`,
            path: `uploads/${Date.now()}-${file.filename}`,
          }),
          deleteFile: async () => {},
        }

        const app = await createVoucherServer({
          prisma: deps.prisma,
          cacheService: deps.cache,
          fileStorage,
          translationClient,
          translationResolver,
        })

        return app
      },
    },
  ]
}
