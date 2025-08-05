import type { ZodRegistry } from '@api/common/registry/base.js'
import * as internalAuthSchemas from '@api/schemas/auth/internal/service.js'
import * as businessParameters from '@api/schemas/business/common/parameters.js'
import * as internalBusinessSchemas from '@api/schemas/business/internal/service.js'
import * as categoryParameters from '@api/schemas/category/common/parameters.js'
import * as internalCategorySchemas from '@api/schemas/category/internal/service.js'
import * as internalCommunicationSchemas from '@api/schemas/communication/internal/service.js'
import * as internalDiscoverySchemas from '@api/schemas/discovery/internal/service.js'
import { ErrorResponse } from '@api/schemas/shared/errors.js'
import { MessageResponse } from '@api/schemas/shared/responses.js'
import * as storageParameters from '@api/schemas/storage/common/parameters.js'
import * as internalStorageSchemas from '@api/schemas/storage/internal/service.js'
import * as internalSubscriptionSchemas from '@api/schemas/subscription/internal/service.js'
import * as healthSchemas from '@api/schemas/system/public/health.js'
import * as internalUserSchemas from '@api/schemas/user/internal/service.js'
import * as internalVoucherSchemas from '@api/schemas/voucher/internal/service.js'
import * as voucherParameters from '@api/schemas/voucher/public/parameters.js'
import { z } from 'zod'

/**
 * Register all internal API schemas and routes
 */
export function registerInternalAPI(registry: ZodRegistry): void {
  // ============= Health & Discovery Schemas =============
  registry.registerSchema('ServiceHealth', healthSchemas.ServiceHealth)

  // ============= Business Service Schemas =============
  registry.registerSchema(
    'InternalBusinessData',
    internalBusinessSchemas.InternalBusinessData,
  )
  registry.registerSchema(
    'InternalBusinessQueryParams',
    internalBusinessSchemas.InternalBusinessQueryParams,
  )
  registry.registerSchema(
    'BulkBusinessRequest',
    internalBusinessSchemas.BulkBusinessRequest,
  )
  registry.registerSchema(
    'BulkBusinessResponse',
    internalBusinessSchemas.BulkBusinessResponse,
  )
  registry.registerSchema(
    'ValidateBusinessRequest',
    internalBusinessSchemas.ValidateBusinessRequest,
  )
  registry.registerSchema(
    'ValidateBusinessResponse',
    internalBusinessSchemas.ValidateBusinessResponse,
  )
  registry.registerSchema(
    'GetBusinessesByUserRequest',
    internalBusinessSchemas.GetBusinessesByUserRequest,
  )
  registry.registerSchema(
    'GetBusinessesByUserResponse',
    internalBusinessSchemas.GetBusinessesByUserResponse,
  )
  registry.registerSchema(
    'GetBusinessRequest',
    internalBusinessSchemas.GetBusinessRequest,
  )
  registry.registerSchema(
    'GetBusinessesByCategoryRequest',
    internalBusinessSchemas.GetBusinessesByCategoryRequest,
  )
  registry.registerSchema(
    'GetBusinessesByCategoryResponse',
    internalBusinessSchemas.GetBusinessesByCategoryResponse,
  )
  registry.registerSchema(
    'CheckBusinessExistsRequest',
    internalBusinessSchemas.CheckBusinessExistsRequest,
  )
  registry.registerSchema(
    'CheckBusinessExistsResponse',
    internalBusinessSchemas.CheckBusinessExistsResponse,
  )
  registry.registerSchema('BusinessIdParam', businessParameters.BusinessIdParam)

  // ============= Category Service Schemas =============
  registry.registerSchema(
    'InternalCategoryData',
    internalCategorySchemas.InternalCategoryData,
  )
  registry.registerSchema(
    'InternalCategoryQueryParams',
    internalCategorySchemas.InternalCategoryQueryParams,
  )
  registry.registerSchema(
    'BulkCategoryRequest',
    internalCategorySchemas.BulkCategoryRequest,
  )
  registry.registerSchema(
    'BulkCategoryResponse',
    internalCategorySchemas.BulkCategoryResponse,
  )
  registry.registerSchema(
    'ValidateCategoryRequest',
    internalCategorySchemas.ValidateCategoryRequest,
  )
  registry.registerSchema(
    'ValidateCategoryResponse',
    internalCategorySchemas.ValidateCategoryResponse,
  )
  registry.registerSchema(
    'CategoryValidationResult',
    internalCategorySchemas.CategoryValidationResult,
  )
  registry.registerSchema(
    'InternalCategoryHierarchyResponse',
    internalCategorySchemas.InternalCategoryHierarchyResponse,
  )
  registry.registerSchema(
    'CheckCategoryExistsRequest',
    internalCategorySchemas.CheckCategoryExistsRequest,
  )
  registry.registerSchema(
    'CheckCategoryExistsResponse',
    internalCategorySchemas.CheckCategoryExistsResponse,
  )
  registry.registerSchema(
    'InternalCategoryListResponse',
    internalCategorySchemas.InternalCategoryListResponse,
  )

  // Category parameter schema
  registry.registerSchema('CategoryIdParam', categoryParameters.CategoryIdParam)

  // ============= Storage Service Schemas =============
  registry.registerSchema(
    'StorageServiceHealthCheck',
    internalStorageSchemas.StorageServiceHealthCheck,
  )
  registry.registerSchema(
    'InternalCreateFileRequest',
    internalStorageSchemas.InternalCreateFileRequest,
  )
  registry.registerSchema(
    'InternalFileResponse',
    internalStorageSchemas.InternalFileResponse,
  )
  registry.registerSchema(
    'InternalBulkDeleteRequest',
    internalStorageSchemas.InternalBulkDeleteRequest,
  )
  registry.registerSchema(
    'InternalBulkDeleteResponse',
    internalStorageSchemas.InternalBulkDeleteResponse,
  )
  registry.registerSchema(
    'GetUserFilesRequest',
    internalStorageSchemas.GetUserFilesRequest,
  )
  registry.registerSchema(
    'UserFileSummaryResponse',
    internalStorageSchemas.UserFileSummaryResponse,
  )
  registry.registerSchema(
    'CheckUserQuotaRequest',
    internalStorageSchemas.CheckUserQuotaRequest,
  )
  registry.registerSchema(
    'UserQuotaResponse',
    internalStorageSchemas.UserQuotaResponse,
  )
  registry.registerSchema(
    'MigrateFileRequest',
    internalStorageSchemas.MigrateFileRequest,
  )
  registry.registerSchema(
    'MigrateFileResponse',
    internalStorageSchemas.MigrateFileResponse,
  )
  registry.registerSchema(
    'CleanupOrphanedFilesRequest',
    internalStorageSchemas.CleanupOrphanedFilesRequest,
  )
  registry.registerSchema(
    'CleanupOrphanedFilesResponse',
    internalStorageSchemas.CleanupOrphanedFilesResponse,
  )

  // Storage parameter schema
  registry.registerSchema('FileIdParam', storageParameters.FileIdParam)

  // ============= Voucher Service Schemas =============
  registry.registerSchema(
    'GetVouchersByIdsRequest',
    internalVoucherSchemas.GetVouchersByIdsRequest,
  )
  registry.registerSchema(
    'GetVouchersByIdsResponse',
    internalVoucherSchemas.GetVouchersByIdsResponse,
  )
  registry.registerSchema(
    'ValidateVoucherRequest',
    internalVoucherSchemas.ValidateVoucherRequest,
  )
  registry.registerSchema(
    'ValidateVoucherResponse',
    internalVoucherSchemas.ValidateVoucherResponse,
  )

  // Voucher parameter schema
  registry.registerSchema(
    'VoucherPathParams',
    voucherParameters.VoucherPathParams,
  )

  registry.registerSchema(
    'ServiceRegistryQuery',
    internalDiscoverySchemas.ServiceRegistryQuery,
  )
  registry.registerSchema(
    'ServiceRegistryResponse',
    internalDiscoverySchemas.ServiceRegistryResponse,
  )
  registry.registerSchema(
    'RegisterServiceRequest',
    internalDiscoverySchemas.RegisterServiceRequest,
  )
  registry.registerSchema(
    'RegisterServiceResponse',
    internalDiscoverySchemas.RegisterServiceResponse,
  )
  registry.registerSchema(
    'ServiceEndpointsResponse',
    internalDiscoverySchemas.ServiceEndpointsResponse,
  )
  registry.registerSchema(
    'DeregisterServiceRequest',
    internalDiscoverySchemas.DeregisterServiceRequest,
  )
  registry.registerSchema(
    'DeregisterServiceResponse',
    internalDiscoverySchemas.DeregisterServiceResponse,
  )
  registry.registerSchema(
    'ServiceConfigResponse',
    internalDiscoverySchemas.ServiceConfigResponse,
  )

  // ============= Auth Service Schemas =============
  registry.registerSchema(
    'ValidateTokenRequest',
    internalAuthSchemas.ValidateTokenRequest,
  )
  registry.registerSchema(
    'TokenValidationResponse',
    internalAuthSchemas.TokenValidationResponse,
  )
  registry.registerSchema(
    'GetUserByEmailRequest',
    internalAuthSchemas.GetUserByEmailRequest,
  )
  registry.registerSchema(
    'AuthUserResponse',
    internalAuthSchemas.AuthUserResponse,
  )
  registry.registerSchema(
    'InitiatePasswordResetRequest',
    internalAuthSchemas.InitiatePasswordResetRequest,
  )
  registry.registerSchema(
    'PasswordResetResponse',
    internalAuthSchemas.PasswordResetResponse,
  )
  registry.registerSchema(
    'ConfirmPasswordResetRequest',
    internalAuthSchemas.ConfirmPasswordResetRequest,
  )
  registry.registerSchema(
    'VerifyAccountRequest',
    internalAuthSchemas.VerifyAccountRequest,
  )
  registry.registerSchema(
    'AccountVerificationResponse',
    internalAuthSchemas.AccountVerificationResponse,
  )
  registry.registerSchema(
    'CreateServiceSessionRequest',
    internalAuthSchemas.CreateServiceSessionRequest,
  )
  registry.registerSchema(
    'ServiceSessionResponse',
    internalAuthSchemas.ServiceSessionResponse,
  )
  registry.registerSchema(
    'CheckUserRoleRequest',
    internalAuthSchemas.CheckUserRoleRequest,
  )
  registry.registerSchema(
    'RoleCheckResponse',
    internalAuthSchemas.RoleCheckResponse,
  )
  registry.registerSchema(
    'ValidateServiceKeyRequest',
    internalAuthSchemas.ValidateServiceKeyRequest,
  )
  registry.registerSchema(
    'ServiceKeyValidationResponse',
    internalAuthSchemas.ServiceKeyValidationResponse,
  )

  // ============= Communication Service Schemas =============
  registry.registerSchema(
    'SendSystemNotificationRequest',
    internalCommunicationSchemas.SendSystemNotificationRequest,
  )
  registry.registerSchema(
    'SendSystemNotificationResponse',
    internalCommunicationSchemas.SendSystemNotificationResponse,
  )
  registry.registerSchema(
    'SendTransactionalEmailRequest',
    internalCommunicationSchemas.SendTransactionalEmailRequest,
  )
  registry.registerSchema(
    'SendTransactionalEmailResponse',
    internalCommunicationSchemas.SendTransactionalEmailResponse,
  )
  registry.registerSchema(
    'SendSMSRequest',
    internalCommunicationSchemas.SendSMSRequest,
  )
  registry.registerSchema(
    'SendSMSResponse',
    internalCommunicationSchemas.SendSMSResponse,
  )
  registry.registerSchema(
    'SendPushNotificationRequest',
    internalCommunicationSchemas.SendPushNotificationRequest,
  )
  registry.registerSchema(
    'SendPushNotificationResponse',
    internalCommunicationSchemas.SendPushNotificationResponse,
  )
  registry.registerSchema(
    'GetUserCommunicationPreferencesRequest',
    internalCommunicationSchemas.GetUserCommunicationPreferencesRequest,
  )
  registry.registerSchema(
    'UserCommunicationPreferencesResponse',
    internalCommunicationSchemas.UserCommunicationPreferencesResponse,
  )
  registry.registerSchema(
    'SendEmailRequest',
    internalCommunicationSchemas.SendEmailRequest,
  )
  registry.registerSchema(
    'SendEmailResponse',
    internalCommunicationSchemas.SendEmailResponse,
  )
  registry.registerSchema(
    'BulkEmailRequest',
    internalCommunicationSchemas.BulkEmailRequest,
  )
  registry.registerSchema(
    'BulkEmailResponse',
    internalCommunicationSchemas.BulkEmailResponse,
  )
  registry.registerSchema(
    'CreateNotificationRequest',
    internalCommunicationSchemas.CreateNotificationRequest,
  )
  registry.registerSchema(
    'CreateNotificationResponse',
    internalCommunicationSchemas.CreateNotificationResponse,
  )
  registry.registerSchema(
    'BatchUpdateNotificationStatusRequest',
    internalCommunicationSchemas.BatchUpdateNotificationStatusRequest,
  )
  registry.registerSchema(
    'BatchUpdateResponse',
    internalCommunicationSchemas.BatchUpdateResponse,
  )

  // ============= User Service Schemas =============
  registry.registerSchema(
    'InternalUserData',
    internalUserSchemas.InternalUserData,
  )
  registry.registerSchema(
    'VerifyUserRequest',
    internalUserSchemas.VerifyUserRequest,
  )
  registry.registerSchema(
    'VerifyUserResponse',
    internalUserSchemas.VerifyUserResponse,
  )
  registry.registerSchema(
    'GetUsersRequest',
    internalUserSchemas.GetUsersRequest,
  )
  registry.registerSchema(
    'GetUsersResponse',
    internalUserSchemas.GetUsersResponse,
  )
  registry.registerSchema(
    'CheckUserPermissionRequest',
    internalUserSchemas.CheckUserPermissionRequest,
  )
  registry.registerSchema(
    'CheckUserPermissionResponse',
    internalUserSchemas.CheckUserPermissionResponse,
  )
  registry.registerSchema(
    'GetUserSubscriptionStatusRequest',
    internalUserSchemas.GetUserSubscriptionStatusRequest,
  )
  registry.registerSchema(
    'UserSubscriptionStatusResponse',
    internalUserSchemas.UserSubscriptionStatusResponse,
  )
  registry.registerSchema(
    'GetUserAuthDataByEmailRequest',
    internalUserSchemas.GetUserAuthDataByEmailRequest,
  )
  registry.registerSchema('UserAuthData', internalUserSchemas.UserAuthData)
  registry.registerSchema(
    'CreateUserRequest',
    internalUserSchemas.CreateUserRequest,
  )
  registry.registerSchema(
    'UpdateLastLoginRequest',
    internalUserSchemas.UpdateLastLoginRequest,
  )
  registry.registerSchema(
    'CreatePasswordResetTokenRequest',
    internalUserSchemas.CreatePasswordResetTokenRequest,
  )
  registry.registerSchema(
    'PasswordResetTokenResponse',
    internalUserSchemas.PasswordResetTokenResponse,
  )
  registry.registerSchema(
    'ValidatePasswordResetTokenRequest',
    internalUserSchemas.ValidatePasswordResetTokenRequest,
  )
  registry.registerSchema(
    'UpdatePasswordRequest',
    internalUserSchemas.UpdatePasswordRequest,
  )
  registry.registerSchema(
    'CreateEmailVerificationTokenRequest',
    internalUserSchemas.CreateEmailVerificationTokenRequest,
  )
  registry.registerSchema(
    'EmailVerificationTokenResponse',
    internalUserSchemas.EmailVerificationTokenResponse,
  )
  registry.registerSchema(
    'ValidateEmailVerificationTokenRequest',
    internalUserSchemas.ValidateEmailVerificationTokenRequest,
  )
  registry.registerSchema(
    'VerifyEmailRequest',
    internalUserSchemas.VerifyEmailRequest,
  )
  registry.registerSchema(
    'CheckEmailExistsRequest',
    internalUserSchemas.CheckEmailExistsRequest,
  )
  registry.registerSchema(
    'CheckPhoneExistsRequest',
    internalUserSchemas.CheckPhoneExistsRequest,
  )
  registry.registerSchema('ExistsResponse', internalUserSchemas.ExistsResponse)
  registry.registerSchema('UserIdParam', internalUserSchemas.UserIdParam)
  registry.registerSchema('EmailParam', internalUserSchemas.EmailParam)
  registry.registerSchema('PhoneParam', internalUserSchemas.PhoneParam)

  // ============= Subscription Service Schemas =============
  registry.registerSchema(
    'InternalSubscriptionData',
    internalSubscriptionSchemas.InternalSubscriptionData,
  )
  registry.registerSchema(
    'CheckSubscriptionRequest',
    internalSubscriptionSchemas.CheckSubscriptionRequest,
  )
  registry.registerSchema(
    'SubscriptionCheckResponse',
    internalSubscriptionSchemas.SubscriptionCheckResponse,
  )
  registry.registerSchema(
    'ProcessSubscriptionUsageRequest',
    internalSubscriptionSchemas.ProcessSubscriptionUsageRequest,
  )
  registry.registerSchema(
    'UsageProcessingResponse',
    internalSubscriptionSchemas.UsageProcessingResponse,
  )
  registry.registerSchema(
    'CreateStripeSubscriptionRequest',
    internalSubscriptionSchemas.CreateStripeSubscriptionRequest,
  )
  registry.registerSchema(
    'UpdateStripeSubscriptionRequest',
    internalSubscriptionSchemas.UpdateStripeSubscriptionRequest,
  )
  registry.registerSchema(
    'CancelStripeSubscriptionRequest',
    internalSubscriptionSchemas.CancelStripeSubscriptionRequest,
  )
  registry.registerSchema(
    'StripeSubscriptionResponse',
    internalSubscriptionSchemas.StripeSubscriptionResponse,
  )
  registry.registerSchema(
    'GetUserSubscriptionsRequest',
    internalSubscriptionSchemas.GetUserSubscriptionsRequest,
  )
  registry.registerSchema(
    'UserSubscriptionsResponse',
    internalSubscriptionSchemas.UserSubscriptionsResponse,
  )
  registry.registerSchema(
    'SubscriptionWebhookEvent',
    internalSubscriptionSchemas.SubscriptionWebhookEvent,
  )
  registry.registerSchema(
    'ProcessWebhookResponse',
    internalSubscriptionSchemas.ProcessWebhookResponse,
  )

  // ============= Payment Service Schemas =============
  // TODO: Add payment service schemas when available

  // ============= Register Routes =============
  registerInternalRoutes(registry)
}

/**
 * Register all internal API routes
 */
function registerInternalRoutes(registry: ZodRegistry): void {
  // ============= Business Service Internal Routes =============

  // Get businesses by IDs (bulk)
  registry.registerRoute({
    method: 'post',
    path: '/businesses/bulk',
    operationId: 'bulkGetInternalBusinesses',
    summary: 'Get multiple businesses by IDs',
    tags: ['Business Service'],
    security: [{ apiKey: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalBusinessSchemas.BulkBusinessRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Businesses data',
        content: {
          'application/json': {
            schema: internalBusinessSchemas.BulkBusinessResponse,
          },
        },
      },
    },
  })

  // Validate businesses
  registry.registerRoute({
    method: 'post',
    path: '/businesses/validate',
    operationId: 'validateInternalBusinesses',
    summary: 'Validate businesses exist and meet criteria',
    tags: ['Business Service'],
    security: [{ apiKey: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalBusinessSchemas.ValidateBusinessRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Business validation results',
        content: {
          'application/json': {
            schema: internalBusinessSchemas.ValidateBusinessResponse,
          },
        },
      },
    },
  })

  // Get businesses by user
  registry.registerRoute({
    method: 'post',
    path: '/businesses/by-user',
    operationId: 'getInternalBusinessesByUser',
    summary: 'Get all businesses owned by a user',
    tags: ['Business Service'],
    security: [{ apiKey: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalBusinessSchemas.GetBusinessesByUserRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User businesses',
        content: {
          'application/json': {
            schema: internalBusinessSchemas.GetBusinessesByUserResponse,
          },
        },
      },
    },
  })

  // Get business by ID
  registry.registerRoute({
    method: 'get',
    path: '/businesses/{id}',
    operationId: 'getInternalBusinessById',
    summary: 'Get business details by ID',
    tags: ['Business Service'],
    security: [{ apiKey: [] }],
    request: {
      params: businessParameters.BusinessIdParam,
      query: internalBusinessSchemas.GetBusinessRequest,
    },
    responses: {
      200: {
        description: 'Business details',
        content: {
          'application/json': {
            schema: internalBusinessSchemas.InternalBusinessData,
          },
        },
      },
    },
  })

  // Get businesses by category
  registry.registerRoute({
    method: 'get',
    path: '/categories/{categoryId}/businesses',
    operationId: 'getInternalBusinessesByCategory',
    summary: 'Get businesses in a specific category',
    tags: ['Business Service'],
    security: [{ apiKey: [] }],
    request: {
      params: categoryParameters.CategoryIdParam,
      query: internalBusinessSchemas.GetBusinessesByCategoryRequest,
    },
    responses: {
      200: {
        description: 'Category businesses',
        content: {
          'application/json': {
            schema: internalBusinessSchemas.GetBusinessesByCategoryResponse,
          },
        },
      },
    },
  })

  // Check if business exists
  registry.registerRoute({
    method: 'post',
    path: '/businesses/exists',
    operationId: 'checkInternalBusinessExists',
    summary: 'Check if business exists and is active',
    tags: ['Business Service'],
    security: [{ apiKey: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalBusinessSchemas.CheckBusinessExistsRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Business existence check result',
        content: {
          'application/json': {
            schema: internalBusinessSchemas.CheckBusinessExistsResponse,
          },
        },
      },
    },
  })

  // ============= Category Service Internal Routes =============

  // Get categories by IDs (bulk)
  registry.registerRoute({
    method: 'post',
    path: '/categories/bulk',
    operationId: 'bulkGetInternalCategories',
    summary: 'Get multiple categories by IDs',
    tags: ['Category Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalCategorySchemas.BulkCategoryRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Category list',
        content: {
          'application/json': {
            schema: internalCategorySchemas.BulkCategoryResponse,
          },
        },
      },
    },
  })

  // Validate categories
  registry.registerRoute({
    method: 'post',
    path: '/categories/validate',
    operationId: 'validateInternalCategories',
    summary: 'Validate categories exist and are active',
    tags: ['Category Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalCategorySchemas.ValidateCategoryRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Category validation results',
        content: {
          'application/json': {
            schema: internalCategorySchemas.ValidateCategoryResponse,
          },
        },
      },
    },
  })

  // Check category exists
  registry.registerRoute({
    method: 'post',
    path: '/categories/exists',
    operationId: 'checkInternalCategoryExists',
    summary: 'Check if category exists',
    tags: ['Category Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalCategorySchemas.CheckCategoryExistsRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Category existence check result',
        content: {
          'application/json': {
            schema: internalCategorySchemas.CheckCategoryExistsResponse,
          },
        },
      },
    },
  })

  // Get category hierarchy (internal)
  registry.registerRoute({
    method: 'get',
    path: '/categories/hierarchy',
    operationId: 'getInternalCategoryHierarchy',
    summary: 'Get category hierarchy for internal use',
    tags: ['Category Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      query: internalCategorySchemas.InternalCategoryQueryParams,
    },
    responses: {
      200: {
        description: 'Category hierarchy',
        content: {
          'application/json': {
            schema: internalCategorySchemas.InternalCategoryHierarchyResponse,
          },
        },
      },
    },
  })

  // Get internal category list
  registry.registerRoute({
    method: 'get',
    path: '/categories',
    operationId: 'getInternalCategoryList',
    summary: 'Get internal category list',
    tags: ['Category Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      query: internalCategorySchemas.InternalCategoryQueryParams,
    },
    responses: {
      200: {
        description: 'Internal category list',
        content: {
          'application/json': {
            schema: internalCategorySchemas.InternalCategoryListResponse,
          },
        },
      },
    },
  })

  // ============= Storage Service Internal Routes =============

  // Create file record
  registry.registerRoute({
    method: 'post',
    path: '/storage/files',
    operationId: 'createInternalFile',
    summary: 'Create file record',
    tags: ['Storage Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalStorageSchemas.InternalCreateFileRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'File record created',
        content: {
          'application/json': {
            schema: internalStorageSchemas.InternalFileResponse,
          },
        },
      },
    },
  })

  // Get file by ID
  registry.registerRoute({
    method: 'get',
    path: '/storage/files/{fileId}',
    operationId: 'getInternalFileById',
    summary: 'Get file record by ID',
    tags: ['Storage Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      params: storageParameters.FileIdParam,
    },
    responses: {
      200: {
        description: 'File record',
        content: {
          'application/json': {
            schema: internalStorageSchemas.InternalFileResponse,
          },
        },
      },
      404: {
        description: 'File not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Bulk delete files
  registry.registerRoute({
    method: 'delete',
    path: '/storage/files/bulk',
    operationId: 'bulkDeleteInternalFiles',
    summary: 'Bulk delete files',
    tags: ['Storage Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalStorageSchemas.InternalBulkDeleteRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Bulk delete results',
        content: {
          'application/json': {
            schema: internalStorageSchemas.InternalBulkDeleteResponse,
          },
        },
      },
    },
  })

  // Get user files
  registry.registerRoute({
    method: 'post',
    path: '/storage/users/files',
    operationId: 'getInternalUserFiles',
    summary: 'Get files for a user',
    tags: ['Storage Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalStorageSchemas.GetUserFilesRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User files',
        content: {
          'application/json': {
            schema: z.array(internalStorageSchemas.InternalFileResponse),
          },
        },
      },
    },
  })

  // Get user file summary
  registry.registerRoute({
    method: 'get',
    path: '/storage/users/{userId}/summary',
    operationId: 'getInternalUserFileSummary',
    summary: 'Get user file summary',
    tags: ['Storage Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      params: z.object({
        userId: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'User file summary',
        content: {
          'application/json': {
            schema: internalStorageSchemas.UserFileSummaryResponse,
          },
        },
      },
    },
  })

  // Check user quota
  registry.registerRoute({
    method: 'post',
    path: '/storage/quota/check',
    operationId: 'checkInternalUserQuota',
    summary: 'Check user storage quota',
    tags: ['Storage Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalStorageSchemas.CheckUserQuotaRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User quota information',
        content: {
          'application/json': {
            schema: internalStorageSchemas.UserQuotaResponse,
          },
        },
      },
    },
  })

  // Migrate file
  registry.registerRoute({
    method: 'post',
    path: '/storage/files/migrate',
    operationId: 'migrateInternalFile',
    summary: 'Migrate file between providers',
    tags: ['Storage Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalStorageSchemas.MigrateFileRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'File migration result',
        content: {
          'application/json': {
            schema: internalStorageSchemas.MigrateFileResponse,
          },
        },
      },
    },
  })

  // Cleanup orphaned files
  registry.registerRoute({
    method: 'post',
    path: '/storage/cleanup/orphaned',
    operationId: 'cleanupInternalOrphanedFiles',
    summary: 'Cleanup orphaned files',
    tags: ['Storage Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalStorageSchemas.CleanupOrphanedFilesRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Cleanup results',
        content: {
          'application/json': {
            schema: internalStorageSchemas.CleanupOrphanedFilesResponse,
          },
        },
      },
    },
  })

  // Storage health check
  registry.registerRoute({
    method: 'get',
    path: '/storage/health',
    operationId: 'getInternalStorageHealth',
    summary: 'Storage service health check',
    tags: ['Storage Service'],
    security: [{ 'x-api-key': [] }],
    responses: {
      200: {
        description: 'Storage service health',
        content: {
          'application/json': {
            schema: internalStorageSchemas.StorageServiceHealthCheck,
          },
        },
      },
    },
  })

  // ============= Voucher Service Internal Routes =============

  // Get vouchers by IDs (bulk)
  registry.registerRoute({
    method: 'post',
    path: '/vouchers/bulk',
    operationId: 'bulkGetInternalVouchers',
    summary: 'Get multiple vouchers by IDs',
    tags: ['Voucher Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalVoucherSchemas.GetVouchersByIdsRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Voucher list',
        content: {
          'application/json': {
            schema: internalVoucherSchemas.GetVouchersByIdsResponse,
          },
        },
      },
    },
  })

  // Validate voucher
  registry.registerRoute({
    method: 'post',
    path: '/vouchers/validate',
    operationId: 'validateInternalVoucher',
    summary: 'Validate voucher availability',
    tags: ['Voucher Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalVoucherSchemas.ValidateVoucherRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Voucher validation result',
        content: {
          'application/json': {
            schema: internalVoucherSchemas.ValidateVoucherResponse,
          },
        },
      },
    },
  })

  // Health check route
  registry.registerRoute({
    method: 'get',
    path: '/health',
    operationId: 'getInternalServiceHealth',
    summary: 'Service health check',
    tags: ['Health'],
    security: [{ 'x-api-key': [] }],
    responses: {
      200: {
        description: 'Service is healthy',
        content: {
          'application/json': {
            schema: healthSchemas.ServiceHealth,
          },
        },
      },
    },
  })

  // Service Registry route
  registry.registerRoute({
    method: 'get',
    path: '/services/registry',
    operationId: 'getInternalServiceRegistry',
    summary: 'Get service registry',
    tags: ['Service Discovery'],
    security: [{ 'x-api-key': [] }],
    request: {
      query: internalDiscoverySchemas.ServiceRegistryQuery,
    },
    responses: {
      200: {
        description: 'Service registry',
        content: {
          'application/json': {
            schema: internalDiscoverySchemas.ServiceRegistryResponse,
          },
        },
      },
    },
  })

  // Register service route
  registry.registerRoute({
    method: 'post',
    path: '/services/register',
    operationId: 'registerInternalService',
    summary: 'Register service instance',
    tags: ['Service Discovery'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalDiscoverySchemas.RegisterServiceRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Service registered',
        content: {
          'application/json': {
            schema: internalDiscoverySchemas.RegisterServiceResponse,
          },
        },
      },
      400: {
        description: 'Invalid registration data',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Deregister service route
  registry.registerRoute({
    method: 'delete',
    path: '/services/{instanceId}/deregister',
    operationId: 'deregisterInternalService',
    summary: 'Deregister service instance',
    tags: ['Service Discovery'],
    security: [{ 'x-api-key': [] }],
    request: {
      params: z.object({
        instanceId: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: internalDiscoverySchemas.DeregisterServiceRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Service deregistered',
        content: {
          'application/json': {
            schema: internalDiscoverySchemas.DeregisterServiceResponse,
          },
        },
      },
      404: {
        description: 'Service instance not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Get service endpoints route
  registry.registerRoute({
    method: 'get',
    path: '/services/{serviceName}/endpoints',
    operationId: 'getInternalServiceEndpoints',
    summary: 'Get service endpoints',
    tags: ['Service Discovery'],
    security: [{ 'x-api-key': [] }],
    request: {
      params: z.object({
        serviceName: z.string(),
      }),
      query: z.object({
        environment: internalDiscoverySchemas.EnvironmentType.optional(),
        healthyOnly: z.boolean().default(true),
      }),
    },
    responses: {
      200: {
        description: 'Service endpoints',
        content: {
          'application/json': {
            schema: internalDiscoverySchemas.ServiceEndpointsResponse,
          },
        },
      },
      404: {
        description: 'Service not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Get service configuration route
  registry.registerRoute({
    method: 'get',
    path: '/config/{serviceName}',
    operationId: 'getInternalServiceConfig',
    summary: 'Get service configuration',
    tags: ['Service Discovery'],
    security: [{ 'x-api-key': [] }],
    request: {
      params: z.object({
        serviceName: z.string(),
      }),
      query: internalDiscoverySchemas.ServiceConfigRequest,
    },
    responses: {
      200: {
        description: 'Service configuration',
        content: {
          'application/json': {
            schema: internalDiscoverySchemas.ServiceConfigResponse,
          },
        },
      },
      404: {
        description: 'Service configuration not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Auth Service Internal Routes
  registry.registerRoute({
    method: 'post',
    path: '/auth/validate-token',
    operationId: 'validateInternalToken',
    summary: 'Validate JWT token',
    tags: ['Auth Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalAuthSchemas.ValidateTokenRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Token validation result',
        content: {
          'application/json': {
            schema: internalAuthSchemas.TokenValidationResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/auth/user-by-email',
    operationId: 'getInternalUserByEmail',
    summary: 'Get user by email',
    tags: ['Auth Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalAuthSchemas.GetUserByEmailRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User details',
        content: {
          'application/json': {
            schema: internalAuthSchemas.AuthUserResponse,
          },
        },
      },
      404: {
        description: 'User not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Communication Service Internal Routes
  registry.registerRoute({
    method: 'post',
    path: '/notifications/system',
    operationId: 'sendInternalSystemNotification',
    summary: 'Send system notification',
    tags: ['Communication Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalCommunicationSchemas.SendSystemNotificationRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Notification sent',
        content: {
          'application/json': {
            schema: internalCommunicationSchemas.SendSystemNotificationResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/emails/transactional',
    operationId: 'sendInternalTransactionalEmail',
    summary: 'Send transactional email',
    tags: ['Communication Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalCommunicationSchemas.SendTransactionalEmailRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Email sent',
        content: {
          'application/json': {
            schema: internalCommunicationSchemas.SendTransactionalEmailResponse,
          },
        },
      },
    },
  })

  // User Service Internal Routes
  registry.registerRoute({
    method: 'get',
    path: '/users/{id}',
    operationId: 'getInternalUserById',
    summary: 'Get user details',
    tags: ['User Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'User details',
        content: {
          'application/json': {
            schema: internalUserSchemas.InternalUserData,
          },
        },
      },
      404: {
        description: 'User not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/users/batch',
    operationId: 'batchGetInternalUsers',
    summary: 'Get multiple users',
    tags: ['User Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalUserSchemas.GetUsersRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User list',
        content: {
          'application/json': {
            schema: z.array(internalUserSchemas.InternalUserData),
          },
        },
      },
    },
  })

  // Note: PATCH /users/{id} route removed - UpdateUserRequest schema doesn't exist in internal user schemas
  // This route should be re-added once the proper schema is defined

  // Subscription Service Internal Routes

  registry.registerRoute({
    method: 'post',
    path: '/subscriptions/user-membership',
    operationId: 'updateInternalUserMembership',
    summary: 'Update user membership status',
    tags: ['Subscription Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema:
              internalSubscriptionSchemas.UpdateSubscriptionFromPaymentRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Membership updated',
        content: {
          'application/json': {
            schema: MessageResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/subscriptions/from-stripe',
    operationId: 'createInternalSubscriptionFromStripe',
    summary: 'Create subscription from Stripe',
    tags: ['Subscription Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema:
              internalSubscriptionSchemas.GetSubscriptionByStripeIdRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Subscription created',
        content: {
          'application/json': {
            schema: z.object({
              id: z.string(),
              status: z.string(),
            }),
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'put',
    path: '/subscriptions/status',
    operationId: 'updateInternalSubscriptionStatus',
    summary: 'Update subscription status',
    tags: ['Subscription Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema:
              internalSubscriptionSchemas.ProcessSubscriptionWebhookRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Status updated',
        content: {
          'application/json': {
            schema: MessageResponse,
          },
        },
      },
    },
  })
}
