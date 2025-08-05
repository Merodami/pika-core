import type { ZodRegistry } from '@api/common/registry/base.js'
import * as authLoginSchemas from '@api/schemas/auth/public/login.js'
import * as authOauthSchemas from '@api/schemas/auth/public/oauth.js'
import * as authPasswordSchemas from '@api/schemas/auth/public/password.js'
import * as authRegisterSchemas from '@api/schemas/auth/public/register.js'
import * as businessEnumSchemas from '@api/schemas/business/common/enums.js'
import * as businessParameters from '@api/schemas/business/common/parameters.js'
import * as businessSchemas from '@api/schemas/business/public/business.js'
import * as categoryParameters from '@api/schemas/category/common/parameters.js'
import * as categorySchemas from '@api/schemas/category/public/category.js'
import * as communicationNotificationSchemas from '@api/schemas/communication/public/notification.js'
import * as paymentHeaderSchemas from '@api/schemas/payment/public/headers.js'
import * as webhookSchemas from '@api/schemas/payment/public/webhooks.js'
import * as pdfParameters from '@api/schemas/pdf/common/parameters.js'
import * as pdfVoucherBookSchemas from '@api/schemas/pdf/public/voucher-book.js'
import { ErrorResponse } from '@api/schemas/shared/errors.js'
import {
  MessageResponse,
  PaginationMetadata,
} from '@api/schemas/shared/responses.js'
import * as storageParameters from '@api/schemas/storage/common/parameters.js'
import * as storageSchemas from '@api/schemas/storage/public/file.js'
import * as subscriptionSchemas from '@api/schemas/subscription/public/index.js'
import * as subscriptionPlanSchemas from '@api/schemas/subscription/public/index.js'
import * as supportParameterSchemas from '@api/schemas/support/common/parameters.js'
import * as supportCommentSchemas from '@api/schemas/support/public/comment.js'
import * as supportProblemSchemas from '@api/schemas/support/public/problem.js'
import * as userEnumSchemas from '@api/schemas/user/common/enums.js'
import * as userAddressSchemas from '@api/schemas/user/public/index.js'
import * as userPaymentMethodSchemas from '@api/schemas/user/public/paymentMethod.js'
import * as userProfileSchemas from '@api/schemas/user/public/profile.js'
import * as voucherEnumSchemas from '@api/schemas/voucher/common/enums.js'
import * as voucherParameters from '@api/schemas/voucher/public/parameters.js'
import * as voucherSchemas from '@api/schemas/voucher/public/voucher.js'

/**
 * Register all public API schemas and routes
 */
export function registerPublicAPI(registry: ZodRegistry): void {
  // ============= Common Schemas =============
  // Register pagination metadata to ensure hasNext/hasPrev are included
  registry.registerSchema('PaginationMetadata', PaginationMetadata)

  // ============= Enum Schemas =============
  // User enums
  registry.registerSchema('UserStatus', userEnumSchemas.UserStatusSchema)
  registry.registerSchema('UserRole', userEnumSchemas.UserRoleSchema)
  registry.registerSchema('UserSortBy', userEnumSchemas.UserSortBySchema)

  // Business enums
  registry.registerSchema(
    'BusinessSortBy',
    businessEnumSchemas.BusinessSortBySchema,
  )
  registry.registerSchema(
    'BusinessStatusFilter',
    businessEnumSchemas.BusinessStatusFilterSchema,
  )

  // Voucher enums
  registry.registerSchema('VoucherState', voucherEnumSchemas.VoucherStateSchema)
  registry.registerSchema(
    'VoucherDiscountType',
    voucherEnumSchemas.VoucherDiscountTypeSchema,
  )

  // ============= Authentication Schemas =============
  // Common auth schemas
  registry.registerSchema(
    'AuthTokensResponse',
    authLoginSchemas.AuthTokensResponse,
  )

  // ============= Business Schemas =============
  registry.registerSchema('BusinessResponse', businessSchemas.BusinessResponse)
  registry.registerSchema(
    'BusinessQueryParams',
    businessSchemas.BusinessQueryParams,
  )
  registry.registerSchema(
    'BusinessPathParams',
    businessSchemas.BusinessPathParams,
  )
  registry.registerSchema(
    'BusinessDetailQueryParams',
    businessSchemas.BusinessDetailQueryParams,
  )
  registry.registerSchema(
    'BusinessListResponse',
    businessSchemas.BusinessListResponse,
  )
  registry.registerSchema(
    'BusinessesByCategoryResponse',
    businessSchemas.BusinessesByCategoryResponse,
  )
  registry.registerSchema(
    'CreateMyBusinessRequest',
    businessSchemas.CreateMyBusinessRequest,
  )
  registry.registerSchema(
    'UpdateMyBusinessRequest',
    businessSchemas.UpdateMyBusinessRequest,
  )
  registry.registerSchema('BusinessIdParam', businessParameters.BusinessIdParam)

  // ============= Category Schemas =============
  registry.registerSchema('CategoryResponse', categorySchemas.CategoryResponse)
  registry.registerSchema(
    'CategoryQueryParams',
    categorySchemas.CategoryQueryParams,
  )
  registry.registerSchema(
    'CategoryListResponse',
    categorySchemas.CategoryListResponse,
  )
  registry.registerSchema(
    'CategoryHierarchyResponse',
    categorySchemas.CategoryHierarchyResponse,
  )
  registry.registerSchema(
    'CategoryPathResponse',
    categorySchemas.CategoryPathResponse,
  )
  registry.registerSchema(
    'CategoryHierarchyQuery',
    categorySchemas.CategoryHierarchyQuery,
  )
  registry.registerSchema(
    'CategoryPathParams',
    categorySchemas.CategoryPathParams,
  )

  // Category parameter schemas
  registry.registerSchema('CategoryIdParam', categoryParameters.CategoryIdParam)

  // ============= Storage Schemas =============
  registry.registerSchema('FileStorageLog', storageSchemas.FileStorageLog)
  registry.registerSchema(
    'FileUploadResponse',
    storageSchemas.FileUploadResponse,
  )
  registry.registerSchema(
    'BatchUploadResponse',
    storageSchemas.BatchUploadResponse,
  )
  registry.registerSchema('FileUrlResponse', storageSchemas.FileUrlResponse)
  registry.registerSchema(
    'GetFileHistoryQuery',
    storageSchemas.GetFileHistoryQuery,
  )
  registry.registerSchema(
    'FileHistoryResponse',
    storageSchemas.FileHistoryResponse,
  )
  registry.registerSchema(
    'FileUploadMetadata',
    storageSchemas.FileUploadMetadata,
  )
  registry.registerSchema('FileUploadRequest', storageSchemas.FileUploadRequest)
  registry.registerSchema(
    'BatchFileUploadRequest',
    storageSchemas.BatchFileUploadRequest,
  )
  registry.registerSchema('GetFileUrlQuery', storageSchemas.GetFileUrlQuery)

  // Storage parameter schemas
  registry.registerSchema('FileIdParam', storageParameters.FileIdParam)

  // ============= Voucher Schemas =============
  registry.registerSchema('VoucherResponse', voucherSchemas.VoucherResponse)
  registry.registerSchema(
    'VoucherCodeResponse',
    voucherSchemas.VoucherCodeResponse,
  )
  registry.registerSchema(
    'VoucherQueryParams',
    voucherSchemas.VoucherQueryParams,
  )
  registry.registerSchema(
    'VoucherListResponse',
    voucherSchemas.VoucherListResponse,
  )
  registry.registerSchema(
    'VoucherScanRequest',
    voucherSchemas.VoucherScanRequest,
  )
  registry.registerSchema(
    'VoucherScanResponse',
    voucherSchemas.VoucherScanResponse,
  )
  registry.registerSchema(
    'VoucherClaimRequest',
    voucherSchemas.VoucherClaimRequest,
  )
  registry.registerSchema(
    'VoucherClaimResponse',
    voucherSchemas.VoucherClaimResponse,
  )
  registry.registerSchema(
    'VoucherRedeemRequest',
    voucherSchemas.VoucherRedeemRequest,
  )
  registry.registerSchema(
    'VoucherRedeemResponse',
    voucherSchemas.VoucherRedeemResponse,
  )
  registry.registerSchema(
    'UserVoucherResponse',
    voucherSchemas.UserVoucherResponse,
  )
  registry.registerSchema(
    'UserVouchersListResponse',
    voucherSchemas.UserVouchersListResponse,
  )

  // Voucher parameter schemas
  registry.registerSchema(
    'VoucherPathParams',
    voucherParameters.VoucherPathParams,
  )

  registry.registerSchema('AuthUserResponse', authLoginSchemas.AuthUserResponse)

  // OAuth schemas
  registry.registerSchema('TokenRequest', authOauthSchemas.TokenRequest)
  registry.registerSchema('TokenResponse', authOauthSchemas.TokenResponse)
  registry.registerSchema(
    'IntrospectRequest',
    authOauthSchemas.IntrospectRequest,
  )
  registry.registerSchema(
    'IntrospectResponse',
    authOauthSchemas.IntrospectResponse,
  )
  registry.registerSchema(
    'RevokeTokenRequest',
    authOauthSchemas.RevokeTokenRequest,
  )
  registry.registerSchema(
    'RevokeTokenResponse',
    authOauthSchemas.RevokeTokenResponse,
  )
  registry.registerSchema('UserInfoResponse', authOauthSchemas.UserInfoResponse)

  registry.registerSchema(
    'ForgotPasswordRequest',
    authPasswordSchemas.ForgotPasswordRequest,
  )
  registry.registerSchema(
    'ResetPasswordRequest',
    authPasswordSchemas.ResetPasswordRequest,
  )
  registry.registerSchema(
    'ChangePasswordRequest',
    authPasswordSchemas.ChangePasswordRequest,
  )

  registry.registerSchema(
    'RegisterRequest',
    authRegisterSchemas.RegisterRequest,
  )
  registry.registerSchema(
    'RegisterResponse',
    authRegisterSchemas.RegisterResponse,
  )
  registry.registerSchema(
    'VerifyEmailRequest',
    authRegisterSchemas.VerifyEmailRequest,
  )
  registry.registerSchema(
    'ResendVerificationRequest',
    authRegisterSchemas.ResendVerificationRequest,
  )

  // ============= Communication Schemas =============
  registry.registerSchema(
    'NotificationListResponse',
    communicationNotificationSchemas.NotificationListResponse,
  )
  registry.registerSchema(
    'UpdateNotificationPreferencesRequest',
    communicationNotificationSchemas.UpdateNotificationPreferencesRequest,
  )
  registry.registerSchema(
    'NotificationPreferencesResponse',
    communicationNotificationSchemas.NotificationPreferencesResponse,
  )
  registry.registerSchema(
    'MarkNotificationsReadRequest',
    communicationNotificationSchemas.MarkNotificationsReadRequest,
  )
  registry.registerSchema(
    'MarkAllAsReadResponse',
    communicationNotificationSchemas.MarkAllAsReadResponse,
  )
  registry.registerSchema(
    'RegisterPushTokenRequest',
    communicationNotificationSchemas.RegisterPushTokenRequest,
  )
  registry.registerSchema(
    'UnregisterPushTokenRequest',
    communicationNotificationSchemas.UnregisterPushTokenRequest,
  )

  // ============= Webhook Schemas =============
  registry.registerSchema(
    'StripeWebhookEvent',
    webhookSchemas.StripeWebhookEvent,
  )
  registry.registerSchema('WebhookResponse', webhookSchemas.WebhookResponse)

  // ============= Subscription Schemas =============
  registry.registerSchema(
    'SubscriptionResponse',
    subscriptionSchemas.SubscriptionResponse,
  )
  registry.registerSchema(
    'SubscriptionListResponse',
    subscriptionSchemas.SubscriptionListResponse,
  )
  registry.registerSchema(
    'CreateSubscriptionRequest',
    subscriptionSchemas.CreateSubscriptionRequest,
  )
  registry.registerSchema(
    'UpdateSubscriptionRequest',
    subscriptionSchemas.UpdateSubscriptionRequest,
  )
  registry.registerSchema(
    'CancelSubscriptionRequest',
    subscriptionSchemas.CancelSubscriptionRequest,
  )
  registry.registerSchema(
    'SubscriptionQueryParams',
    subscriptionSchemas.SubscriptionQueryParams,
  )
  registry.registerSchema(
    'SubscriptionIdParam',
    subscriptionSchemas.SubscriptionIdParam,
  )

  registry.registerSchema(
    'SubscriptionPlanListResponse',
    subscriptionPlanSchemas.SubscriptionPlanListResponse,
  )
  registry.registerSchema(
    'SubscriptionPlanDetailResponse',
    subscriptionPlanSchemas.SubscriptionPlanDetailResponse,
  )
  registry.registerSchema(
    'CreateSubscriptionPlanRequest',
    subscriptionPlanSchemas.CreateSubscriptionPlanRequest,
  )
  registry.registerSchema(
    'UpdateSubscriptionPlanRequest',
    subscriptionPlanSchemas.UpdateSubscriptionPlanRequest,
  )
  registry.registerSchema(
    'SubscriptionPlanQueryParams',
    subscriptionPlanSchemas.SubscriptionPlanQueryParams,
  )
  registry.registerSchema('PlanIdParam', subscriptionPlanSchemas.PlanIdParam)

  // ============= Support Schemas =============
  // Problem schemas
  registry.registerSchema(
    'CreateSupportProblemRequest',
    supportProblemSchemas.CreateSupportProblemRequest,
  )
  registry.registerSchema(
    'SupportProblemResponse',
    supportProblemSchemas.SupportProblemResponse,
  )
  registry.registerSchema(
    'SupportProblemListResponse',
    supportProblemSchemas.SupportProblemListResponse,
  )
  registry.registerSchema(
    'ProblemIdParam',
    supportParameterSchemas.ProblemIdParam,
  )
  registry.registerSchema(
    'SupportProblemSearchParams',
    supportProblemSchemas.SupportProblemSearchParams,
  )

  // Comment schemas
  registry.registerSchema(
    'CreateSupportCommentRequest',
    supportCommentSchemas.CreateSupportCommentRequest,
  )
  registry.registerSchema(
    'UpdateSupportCommentRequest',
    supportCommentSchemas.UpdateSupportCommentRequest,
  )
  registry.registerSchema(
    'SupportCommentResponse',
    supportCommentSchemas.SupportCommentResponse,
  )
  registry.registerSchema(
    'SupportCommentListResponse',
    supportCommentSchemas.SupportCommentListResponse,
  )
  registry.registerSchema(
    'SupportCommentIdParam',
    supportParameterSchemas.SupportCommentIdParam,
  )
  registry.registerSchema(
    'ProblemIdForCommentsParam',
    supportParameterSchemas.ProblemIdForCommentsParam,
  )
  registry.registerSchema(
    'SupportCommentSearchParams',
    supportCommentSchemas.SupportCommentSearchParams,
  )

  // ============= User Schemas =============
  registry.registerSchema(
    'UserProfileResponse',
    userProfileSchemas.UserProfileResponse,
  )
  registry.registerSchema(
    'UpdateProfileRequest',
    userProfileSchemas.UpdateProfileRequest,
  )
  registry.registerSchema(
    'UploadAvatarRequest',
    userProfileSchemas.UploadAvatarRequest,
  )
  registry.registerSchema(
    'DeleteAccountRequest',
    userProfileSchemas.DeleteAccountRequest,
  )
  registry.registerSchema(
    'CurrentUserProfile',
    userProfileSchemas.CurrentUserProfile,
  )

  registry.registerSchema('UserAddress', userAddressSchemas.UserAddress)
  registry.registerSchema('AddressResponse', userAddressSchemas.AddressResponse)
  registry.registerSchema(
    'AddressListResponse',
    userAddressSchemas.AddressListResponse,
  )
  registry.registerSchema(
    'CreateAddressRequest',
    userAddressSchemas.CreateAddressRequest,
  )
  registry.registerSchema(
    'UpdateAddressRequest',
    userAddressSchemas.UpdateAddressRequest,
  )
  registry.registerSchema('AddressIdParam', userAddressSchemas.AddressIdParam)

  registry.registerSchema(
    'PaymentMethod',
    userPaymentMethodSchemas.PaymentMethod,
  )
  registry.registerSchema(
    'UserPaymentMethodsResponse',
    userPaymentMethodSchemas.UserPaymentMethodsResponse,
  )
  registry.registerSchema(
    'AddPaymentMethodRequest',
    userPaymentMethodSchemas.AddPaymentMethodRequest,
  )
  registry.registerSchema(
    'UpdatePaymentMethodRequest',
    userPaymentMethodSchemas.UpdatePaymentMethodRequest,
  )

  // ============= PDF/Voucher Book Schemas =============
  registry.registerSchema(
    'VoucherBookResponse',
    pdfVoucherBookSchemas.VoucherBookResponse,
  )
  registry.registerSchema(
    'VoucherBookListResponse',
    pdfVoucherBookSchemas.VoucherBookListResponse,
  )
  registry.registerSchema(
    'VoucherBookDetailResponse',
    pdfVoucherBookSchemas.VoucherBookDetailResponse,
  )
  registry.registerSchema(
    'VoucherBookQueryParams',
    pdfVoucherBookSchemas.VoucherBookQueryParams,
  )
  registry.registerSchema(
    'PdfDownloadResponse',
    pdfVoucherBookSchemas.PdfDownloadResponse,
  )

  // PDF parameter schemas
  registry.registerSchema(
    'VoucherBookIdParam',
    pdfParameters.VoucherBookIdParam,
  )

  // ============= Register Routes =============
  registerPublicRoutes(registry)
}

/**
 * Register all public API routes
 */
function registerPublicRoutes(registry: ZodRegistry): void {
  // Additional schemas needed for routes
  registry.registerSchema('Subscription', subscriptionSchemas.Subscription)
  registry.registerSchema(
    'SubscriptionPlan',
    subscriptionPlanSchemas.SubscriptionPlan,
  )
  registry.registerSchema(
    'Notification',
    communicationNotificationSchemas.Notification,
  )
  registry.registerSchema(
    'CreateNotificationRequest',
    communicationNotificationSchemas.CreateNotificationRequest,
  )
  registry.registerSchema(
    'StripeWebhookEvent',
    webhookSchemas.StripeWebhookEvent,
  )
  registry.registerSchema('WebhookResponse', webhookSchemas.WebhookResponse)
  registry.registerSchema(
    'WebhookErrorResponse',
    webhookSchemas.WebhookErrorResponse,
  )

  // ============= Business Public Routes =============

  // Get all businesses (public listing)
  registry.registerRoute({
    method: 'get',
    path: '/businesses',
    operationId: 'getBusinessList',
    summary: 'List all active businesses',
    tags: ['Business'],
    request: {
      query: businessSchemas.BusinessQueryParams,
    },
    responses: {
      200: {
        description: 'List of businesses',
        content: {
          'application/json': {
            schema: businessSchemas.BusinessListResponse,
          },
        },
      },
    },
  })

  // Get business by ID (public view)
  registry.registerRoute({
    method: 'get',
    path: '/businesses/{id}',
    operationId: 'getBusinessById',
    summary: 'Get business details',
    tags: ['Business'],
    request: {
      params: businessSchemas.BusinessPathParams,
      query: businessSchemas.BusinessDetailQueryParams,
    },
    responses: {
      200: {
        description: 'Business details',
        content: {
          'application/json': {
            schema: businessSchemas.BusinessResponse,
          },
        },
      },
    },
  })

  // Get businesses by category
  registry.registerRoute({
    method: 'get',
    path: '/categories/{categoryId}/businesses',
    operationId: 'getBusinessesByCategory',
    summary: 'Get businesses in a specific category',
    tags: ['Business'],
    request: {
      params: categoryParameters.CategoryIdParam,
      query: businessSchemas.BusinessQueryParams,
    },
    responses: {
      200: {
        description: 'Businesses in category',
        content: {
          'application/json': {
            schema: businessSchemas.BusinessesByCategoryResponse,
          },
        },
      },
    },
  })

  // Create my business (authenticated users)
  registry.registerRoute({
    method: 'post',
    path: '/my/business',
    operationId: 'createMyBusiness',
    summary: 'Create my business',
    tags: ['My Business'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: businessSchemas.CreateMyBusinessRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Business created successfully',
        content: {
          'application/json': {
            schema: businessSchemas.BusinessResponse,
          },
        },
      },
    },
  })

  // Get my business (authenticated users)
  registry.registerRoute({
    method: 'get',
    path: '/my/business',
    operationId: 'getMyBusiness',
    summary: 'Get my business details',
    tags: ['My Business'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'My business details',
        content: {
          'application/json': {
            schema: businessSchemas.BusinessResponse,
          },
        },
      },
    },
  })

  // Update my business (authenticated users)
  registry.registerRoute({
    method: 'put',
    path: '/my/business',
    operationId: 'updateMyBusiness',
    summary: 'Update my business',
    tags: ['My Business'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: businessSchemas.UpdateMyBusinessRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Business updated successfully',
        content: {
          'application/json': {
            schema: businessSchemas.BusinessResponse,
          },
        },
      },
    },
  })

  // Delete my business (authenticated users)
  registry.registerRoute({
    method: 'delete',
    path: '/my/business',
    operationId: 'deleteMyBusiness',
    summary: 'Delete my business',
    tags: ['My Business'],
    security: [{ bearerAuth: [] }],
    responses: {
      204: {
        description: 'Business deleted successfully',
      },
    },
  })

  // ============= Category Public Routes =============

  // Get all categories (public, read-only)
  registry.registerRoute({
    method: 'get',
    path: '/categories',
    operationId: 'getCategoryList',
    summary: 'List all active categories',
    tags: ['Categories'],
    request: {
      query: categorySchemas.CategoryQueryParams,
    },
    responses: {
      200: {
        description: 'List of categories',
        content: {
          'application/json': {
            schema: categorySchemas.CategoryListResponse,
          },
        },
      },
    },
  })

  // Get category by ID (public, read-only)
  registry.registerRoute({
    method: 'get',
    path: '/categories/{id}',
    operationId: 'getCategoryById',
    summary: 'Get category details',
    tags: ['Categories'],
    request: {
      params: categoryParameters.CategoryIdParam,
    },
    responses: {
      200: {
        description: 'Category details',
        content: {
          'application/json': {
            schema: categorySchemas.CategoryResponse,
          },
        },
      },
      404: {
        description: 'Category not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Get category hierarchy
  registry.registerRoute({
    method: 'get',
    path: '/categories/hierarchy',
    operationId: 'getCategoryHierarchy',
    summary: 'Get category hierarchy tree',
    tags: ['Categories'],
    request: {
      query: categorySchemas.CategoryHierarchyQuery,
    },
    responses: {
      200: {
        description: 'Category hierarchy structure',
        content: {
          'application/json': {
            schema: categorySchemas.CategoryHierarchyResponse,
          },
        },
      },
    },
  })

  // Get category path
  registry.registerRoute({
    method: 'get',
    path: '/categories/{id}/path',
    operationId: 'getCategoryPath',
    summary: 'Get path from root to category',
    tags: ['Categories'],
    request: {
      params: categoryParameters.CategoryIdParam,
    },
    responses: {
      200: {
        description: 'Category path from root',
        content: {
          'application/json': {
            schema: categorySchemas.CategoryPathResponse,
          },
        },
      },
      404: {
        description: 'Category not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // ============= Storage Public Routes =============

  // Upload file
  registry.registerRoute({
    method: 'post',
    path: '/storage/upload',
    operationId: 'uploadFile',
    summary: 'Upload a file',
    tags: ['Storage'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: storageSchemas.FileUploadRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'File uploaded successfully',
        content: {
          'application/json': {
            schema: storageSchemas.FileUploadResponse,
          },
        },
      },
      400: {
        description: 'Invalid file or request',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Batch upload files
  registry.registerRoute({
    method: 'post',
    path: '/storage/batch-upload',
    operationId: 'batchUploadFiles',
    summary: 'Upload multiple files',
    tags: ['Storage'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: storageSchemas.BatchFileUploadRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Batch upload completed',
        content: {
          'application/json': {
            schema: storageSchemas.BatchUploadResponse,
          },
        },
      },
      400: {
        description: 'Invalid request',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Get file URL
  registry.registerRoute({
    method: 'get',
    path: '/storage/files/{fileId}/url',
    operationId: 'getFileUrl',
    summary: 'Get presigned URL for file access',
    tags: ['Storage'],
    security: [{ bearerAuth: [] }],
    request: {
      params: storageParameters.FileIdParam,
      query: storageSchemas.GetFileUrlQuery,
    },
    responses: {
      200: {
        description: 'Presigned URL generated',
        content: {
          'application/json': {
            schema: storageSchemas.FileUrlResponse,
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

  // Get user file history
  registry.registerRoute({
    method: 'get',
    path: '/storage/history',
    operationId: 'getFileHistory',
    summary: 'Get user file upload history',
    tags: ['Storage'],
    security: [{ bearerAuth: [] }],
    request: {
      query: storageSchemas.GetFileHistoryQuery,
    },
    responses: {
      200: {
        description: 'File history',
        content: {
          'application/json': {
            schema: storageSchemas.FileHistoryResponse,
          },
        },
      },
    },
  })

  // Delete file
  registry.registerRoute({
    method: 'delete',
    path: '/storage/files/{fileId}',
    operationId: 'deleteFile',
    summary: 'Delete user file',
    tags: ['Storage'],
    security: [{ bearerAuth: [] }],
    request: {
      params: storageParameters.FileIdParam,
    },
    responses: {
      204: {
        description: 'File deleted successfully',
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

  // ============= Voucher Public Routes =============

  // Get all vouchers (public, read-only)
  registry.registerRoute({
    method: 'get',
    path: '/vouchers',
    operationId: 'getVoucherList',
    summary: 'List all active vouchers',
    tags: ['Vouchers'],
    request: {
      query: voucherSchemas.VoucherQueryParams,
    },
    responses: {
      200: {
        description: 'List of vouchers',
        content: {
          'application/json': {
            schema: voucherSchemas.VoucherListResponse,
          },
        },
      },
    },
  })

  // Get voucher by ID (public, read-only)
  registry.registerRoute({
    method: 'get',
    path: '/vouchers/{id}',
    operationId: 'getVoucherById',
    summary: 'Get voucher details',
    tags: ['Vouchers'],
    request: {
      params: voucherParameters.VoucherPathParams,
    },
    responses: {
      200: {
        description: 'Voucher details',
        content: {
          'application/json': {
            schema: voucherSchemas.VoucherResponse,
          },
        },
      },
      404: {
        description: 'Voucher not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Scan voucher
  registry.registerRoute({
    method: 'post',
    path: '/vouchers/{id}/scan',
    operationId: 'scanVoucher',
    summary: 'Scan a voucher',
    tags: ['Vouchers'],
    security: [{ bearerAuth: [] }],
    request: {
      params: voucherParameters.VoucherPathParams,
      body: {
        content: {
          'application/json': {
            schema: voucherSchemas.VoucherScanRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Voucher scan result',
        content: {
          'application/json': {
            schema: voucherSchemas.VoucherScanResponse,
          },
        },
      },
      404: {
        description: 'Voucher not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Claim voucher
  registry.registerRoute({
    method: 'post',
    path: '/vouchers/{id}/claim',
    operationId: 'claimVoucher',
    summary: 'Claim a voucher',
    tags: ['Vouchers'],
    security: [{ bearerAuth: [] }],
    request: {
      params: voucherParameters.VoucherPathParams,
      body: {
        content: {
          'application/json': {
            schema: voucherSchemas.VoucherClaimRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Voucher claimed successfully',
        content: {
          'application/json': {
            schema: voucherSchemas.VoucherClaimResponse,
          },
        },
      },
      400: {
        description: 'Cannot claim voucher',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
      404: {
        description: 'Voucher not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Redeem voucher
  registry.registerRoute({
    method: 'post',
    path: '/vouchers/{id}/redeem',
    operationId: 'redeemVoucher',
    summary: 'Redeem a voucher',
    tags: ['Vouchers'],
    security: [{ bearerAuth: [] }],
    request: {
      params: voucherParameters.VoucherPathParams,
      body: {
        content: {
          'application/json': {
            schema: voucherSchemas.VoucherRedeemRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Voucher redeemed successfully',
        content: {
          'application/json': {
            schema: voucherSchemas.VoucherRedeemResponse,
          },
        },
      },
      400: {
        description: 'Cannot redeem voucher',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
      404: {
        description: 'Voucher not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Get user vouchers
  registry.registerRoute({
    method: 'get',
    path: '/users/vouchers',
    operationId: 'getUserVouchers',
    summary: 'Get user claimed vouchers',
    tags: ['Vouchers'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'User vouchers',
        content: {
          'application/json': {
            schema: voucherSchemas.UserVouchersListResponse,
          },
        },
      },
    },
  })

  // OAuth 2.0 Authentication routes
  registry.registerRoute({
    method: 'post',
    path: '/auth/token',
    operationId: 'authToken',
    summary: 'OAuth 2.0 Token Endpoint',
    description:
      'Exchange credentials or refresh token for access tokens (RFC 6749)',
    tags: ['Authentication'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authOauthSchemas.TokenRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Successfully generated tokens',
        content: {
          'application/json': {
            schema: authOauthSchemas.TokenResponse,
          },
        },
      },
      400: {
        description: 'Invalid request',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
      401: {
        description: 'Invalid credentials',
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
    path: '/auth/register',
    operationId: 'authRegister',
    summary: 'User registration',
    tags: ['Authentication'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authRegisterSchemas.RegisterRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Registration successful',
        content: {
          'application/json': {
            schema: authRegisterSchemas.RegisterResponse,
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

  registry.registerRoute({
    method: 'post',
    path: '/auth/introspect',
    operationId: 'authIntrospect',
    summary: 'OAuth 2.0 Token Introspection',
    description: 'Check if a token is active and get its metadata (RFC 7662)',
    tags: ['Authentication'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authOauthSchemas.IntrospectRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Token introspection result',
        content: {
          'application/json': {
            schema: authOauthSchemas.IntrospectResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/auth/revoke',
    operationId: 'authRevoke',
    summary: 'OAuth 2.0 Token Revocation',
    description: 'Revoke an access or refresh token (RFC 7009)',
    tags: ['Authentication'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authOauthSchemas.RevokeTokenRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Token successfully revoked',
        content: {
          'application/json': {
            schema: authOauthSchemas.RevokeTokenResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/auth/userinfo',
    operationId: 'authUserInfo',
    summary: 'OAuth 2.0 UserInfo Endpoint',
    description: 'Get information about the authenticated user',
    tags: ['Authentication'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'User information',
        content: {
          'application/json': {
            schema: authOauthSchemas.UserInfoResponse,
          },
        },
      },
      401: {
        description: 'Not authenticated',
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
    path: '/auth/forgot-password',
    operationId: 'forgotPassword',
    summary: 'Request password reset',
    tags: ['Authentication'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authPasswordSchemas.ForgotPasswordRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Password reset email sent (if account exists)',
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
    path: '/auth/reset-password',
    operationId: 'resetPassword',
    summary: 'Reset password with token',
    tags: ['Authentication'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authPasswordSchemas.ResetPasswordRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Password reset successful',
        content: {
          'application/json': {
            schema: MessageResponse,
          },
        },
      },
      400: {
        description: 'Invalid or expired token',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/auth/verify-email/{token}',
    operationId: 'verifyEmail',
    summary: 'Verify email address',
    tags: ['Authentication'],
    request: {
      params: authRegisterSchemas.VerifyEmailRequest,
    },
    responses: {
      200: {
        description: 'Email verified successfully',
        content: {
          'application/json': {
            schema: MessageResponse,
          },
        },
      },
      400: {
        description: 'Invalid or expired verification token',
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
    path: '/auth/resend-verification',
    operationId: 'resendVerification',
    summary: 'Resend email verification',
    tags: ['Authentication'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authPasswordSchemas.ForgotPasswordRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Verification email sent (if account exists)',
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
    path: '/auth/change-password',
    operationId: 'changePassword',
    summary: 'Change user password',
    tags: ['Authentication'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authPasswordSchemas.ChangePasswordRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Password changed successfully',
        content: {
          'application/json': {
            schema: MessageResponse,
          },
        },
      },
      400: {
        description: 'Invalid current password',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // User routes
  registry.registerRoute({
    method: 'get',
    path: '/users/me',
    operationId: 'getUserProfile',
    summary: 'Get current user profile',
    tags: ['Users'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'User profile',
        content: {
          'application/json': {
            schema: userProfileSchemas.CurrentUserProfile,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'put',
    path: '/users/me',
    operationId: 'updateUserProfile',
    summary: 'Update user profile',
    tags: ['Users'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: userProfileSchemas.UpdateProfileRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated profile',
        content: {
          'application/json': {
            schema: userProfileSchemas.CurrentUserProfile,
          },
        },
      },
    },
  })

  // Stripe webhook route (no authentication - uses signature verification)
  registry.registerRoute({
    method: 'post',
    path: '/webhooks/stripe',
    operationId: 'handleStripeWebhook',
    summary: 'Handle Stripe webhook events',
    tags: ['Webhooks'],
    description:
      'Endpoint for receiving Stripe webhook events. Uses signature verification instead of JWT authentication.',
    request: {
      headers: paymentHeaderSchemas.StripeWebhookHeaders,
      body: {
        content: {
          'application/json': {
            schema: webhookSchemas.StripeWebhookEvent,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Webhook processed successfully',
        content: {
          'application/json': {
            schema: webhookSchemas.WebhookResponse,
          },
        },
      },
      400: {
        description: 'Invalid webhook signature or payload',
        content: {
          'application/json': {
            schema: webhookSchemas.WebhookErrorResponse,
          },
        },
      },
      500: {
        description: 'Webhook processing error',
        content: {
          'application/json': {
            schema: webhookSchemas.WebhookErrorResponse,
          },
        },
      },
    },
  })

  // Support Problem routes
  registry.registerRoute({
    method: 'post',
    path: '/problems',
    operationId: 'createSupportProblem',
    summary: 'Create a new support problem',
    tags: ['Support'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: supportProblemSchemas.CreateSupportProblemRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Problem created successfully',
        content: {
          'application/json': {
            schema: supportProblemSchemas.SupportProblemResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/problems',
    operationId: 'getUserSupportProblems',
    summary: "Get user's support problems",
    tags: ['Support'],
    security: [{ bearerAuth: [] }],
    request: {
      query: supportProblemSchemas.SupportProblemSearchParams,
    },
    responses: {
      200: {
        description: "List of user's problems",
        content: {
          'application/json': {
            schema: supportProblemSchemas.SupportProblemListResponse,
          },
        },
      },
    },
  })

  // Support Comment routes
  registry.registerRoute({
    method: 'post',
    path: '/comments',
    operationId: 'createSupportComment',
    summary: 'Create a new comment',
    tags: ['Support'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: supportCommentSchemas.CreateSupportCommentRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Comment created successfully',
        content: {
          'application/json': {
            schema: supportCommentSchemas.SupportCommentResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/comments/problem/{problemId}',
    operationId: 'getProblemComments',
    summary: 'Get comments for a problem',
    tags: ['Support'],
    security: [{ bearerAuth: [] }],
    request: {
      params: supportParameterSchemas.ProblemIdForCommentsParam,
    },
    responses: {
      200: {
        description: 'List of comments',
        content: {
          'application/json': {
            schema: supportCommentSchemas.SupportCommentListResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/comments/{id}',
    operationId: 'getSupportCommentById',
    summary: 'Get comment by ID',
    tags: ['Support'],
    security: [{ bearerAuth: [] }],
    request: {
      params: supportParameterSchemas.SupportCommentIdParam,
    },
    responses: {
      200: {
        description: 'Comment details',
        content: {
          'application/json': {
            schema: supportCommentSchemas.SupportCommentResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'put',
    path: '/comments/{id}',
    operationId: 'updateSupportComment',
    summary: 'Update comment',
    tags: ['Support'],
    security: [{ bearerAuth: [] }],
    request: {
      params: supportParameterSchemas.SupportCommentIdParam,
      body: {
        content: {
          'application/json': {
            schema: supportCommentSchemas.UpdateSupportCommentRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Comment updated successfully',
        content: {
          'application/json': {
            schema: supportCommentSchemas.SupportCommentResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'delete',
    path: '/comments/{id}',
    operationId: 'deleteSupportComment',
    summary: 'Delete comment',
    tags: ['Support'],
    security: [{ bearerAuth: [] }],
    request: {
      params: supportParameterSchemas.SupportCommentIdParam,
    },
    responses: {
      204: {
        description: 'Comment deleted successfully',
      },
    },
  })

  // ============= PDF/Voucher Book Public Routes =============

  // Get all voucher books (public, read-only)
  registry.registerRoute({
    method: 'get',
    path: '/voucher-books',
    operationId: 'getVoucherBookList',
    summary: 'List all published voucher books',
    tags: ['PDF'],
    request: {
      query: pdfVoucherBookSchemas.VoucherBookQueryParams,
    },
    responses: {
      200: {
        description: 'List of voucher books',
        content: {
          'application/json': {
            schema: pdfVoucherBookSchemas.VoucherBookListResponse,
          },
        },
      },
    },
  })

  // Get voucher book by ID (public, read-only)
  registry.registerRoute({
    method: 'get',
    path: '/voucher-books/{id}',
    operationId: 'getVoucherBookById',
    summary: 'Get voucher book details',
    tags: ['PDF'],
    request: {
      params: pdfParameters.VoucherBookIdParam,
    },
    responses: {
      200: {
        description: 'Voucher book details',
        content: {
          'application/json': {
            schema: pdfVoucherBookSchemas.VoucherBookDetailResponse,
          },
        },
      },
      404: {
        description: 'Voucher book not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Download PDF (public, read-only)
  registry.registerRoute({
    method: 'get',
    path: '/voucher-books/{id}/download',
    operationId: 'downloadVoucherBookPdf',
    summary: 'Download voucher book PDF',
    tags: ['PDF'],
    request: {
      params: pdfParameters.VoucherBookIdParam,
    },
    responses: {
      200: {
        description: 'PDF download information',
        content: {
          'application/json': {
            schema: pdfVoucherBookSchemas.PdfDownloadResponse,
          },
        },
      },
      404: {
        description: 'Voucher book not found or PDF not available',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })
}
