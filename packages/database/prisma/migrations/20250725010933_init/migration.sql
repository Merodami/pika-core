-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "analytics";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "audit";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "business";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "catalog";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "files";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "i18n";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "identity";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "marketplace";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "payments";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "security";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "support";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "users";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis_tiger_geocoder";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis_topology";

-- CreateEnum
CREATE TYPE "identity"."UserRole" AS ENUM ('admin', 'customer', 'business');

-- CreateEnum
CREATE TYPE "identity"."UserStatus" AS ENUM ('active', 'suspended', 'banned', 'unconfirmed');

-- CreateEnum
CREATE TYPE "audit"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'STATUS_CHANGE');

-- CreateEnum
CREATE TYPE "support"."ProblemStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_INTERNAL', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "support"."ProblemPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "support"."ProblemType" AS ENUM ('BILLING', 'TECHNICAL', 'ACCOUNT', 'GENERAL', 'BUG_REPORT', 'FEATURE_REQUEST');

-- CreateEnum
CREATE TYPE "support"."NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "support"."NotificationType" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP');

-- CreateEnum
CREATE TYPE "support"."CommunicationMethod" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP');

-- CreateEnum
CREATE TYPE "payments"."SubscriptionStatus" AS ENUM ('active', 'canceled', 'incomplete', 'incompleteExpired', 'pastDue', 'trialing', 'unpaid');

-- CreateEnum
CREATE TYPE "files"."FileType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'OTHER');

-- CreateEnum
CREATE TYPE "files"."StorageProvider" AS ENUM ('AWS_S3', 'LOCAL', 'MINIO');

-- CreateEnum
CREATE TYPE "files"."VoucherBookStatus" AS ENUM ('draft', 'ready_for_print', 'published', 'archived');

-- CreateEnum
CREATE TYPE "files"."VoucherBookType" AS ENUM ('monthly', 'special_edition', 'regional', 'seasonal', 'promotional');

-- CreateEnum
CREATE TYPE "files"."PageLayoutType" AS ENUM ('standard', 'mixed', 'full_page', 'custom');

-- CreateEnum
CREATE TYPE "files"."AdSize" AS ENUM ('single', 'quarter', 'half', 'full');

-- CreateEnum
CREATE TYPE "files"."ContentType" AS ENUM ('voucher', 'image', 'ad', 'sponsored');

-- CreateEnum
CREATE TYPE "business"."VoucherState" AS ENUM ('draft', 'published', 'claimed', 'redeemed', 'expired', 'suspended');

-- CreateEnum
CREATE TYPE "business"."VoucherType" AS ENUM ('percentage', 'fixed');

-- CreateEnum
CREATE TYPE "business"."VoucherCodeType" AS ENUM ('qr', 'short', 'static');

-- CreateEnum
CREATE TYPE "analytics"."VoucherScanType" AS ENUM ('customer', 'business');

-- CreateEnum
CREATE TYPE "analytics"."VoucherScanSource" AS ENUM ('camera', 'gallery', 'link', 'share');

-- CreateEnum
CREATE TYPE "business"."CustomerVoucherStatus" AS ENUM ('claimed', 'redeemed', 'expired');

-- CreateEnum
CREATE TYPE "security"."FraudCaseStatus" AS ENUM ('pending', 'reviewing', 'approved', 'rejected', 'false_positive');

-- CreateEnum
CREATE TYPE "identity"."DeviceType" AS ENUM ('ios', 'android', 'web', 'desktop');

-- CreateEnum
CREATE TYPE "identity"."MfaMethod" AS ENUM ('sms', 'totp', 'email', 'backup_codes');

-- CreateTable
CREATE TABLE "users"."addresses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "address_line1" VARCHAR(255) NOT NULL,
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "postal_code" VARCHAR(20) NOT NULL,
    "country" VARCHAR(100) NOT NULL DEFAULT 'United States',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit"."audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" "audit"."AuditAction" NOT NULL,
    "user_id" UUID,
    "data" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."user_identities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "provider_id" VARCHAR(255) NOT NULL,
    "firebase_uid" VARCHAR(128),
    "provider_data" JSONB NOT NULL DEFAULT '{}',
    "last_sign_in_method" VARCHAR(50),
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."user_auth_methods" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "auth_method" VARCHAR(50) NOT NULL,
    "provider_data" JSONB NOT NULL DEFAULT '{}',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_auth_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."user_devices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "device_id" VARCHAR(255) NOT NULL,
    "device_name" VARCHAR(255),
    "device_type" "identity"."DeviceType" NOT NULL,
    "browser_info" JSONB NOT NULL DEFAULT '{}',
    "last_ip_address" INET,
    "last_location" JSONB,
    "is_trusted" BOOLEAN NOT NULL DEFAULT false,
    "trust_expires_at" TIMESTAMPTZ(6),
    "fcm_token" VARCHAR(500),
    "last_active_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."user_mfa_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "preferred_method" "identity"."MfaMethod",
    "backup_codes_hash" TEXT[],
    "backup_codes_generated_at" TIMESTAMPTZ(6),
    "backup_codes_used" INTEGER NOT NULL DEFAULT 0,
    "totp_secret_encrypted" TEXT,
    "recovery_email" VARCHAR(255),
    "phone_number_verified" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_mfa_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."security_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "device_id" UUID,
    "event_type" VARCHAR(100) NOT NULL,
    "event_data" JSONB NOT NULL DEFAULT '{}',
    "ip_address" INET,
    "user_agent" TEXT,
    "location" JSONB,
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."businesses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "business_name_key" VARCHAR(255) NOT NULL,
    "business_description_key" VARCHAR(255),
    "category_id" UUID NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "avg_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name_key" VARCHAR(255) NOT NULL,
    "description_key" VARCHAR(255),
    "icon" VARCHAR(255),
    "parent_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "slug" VARCHAR(255) NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "path" VARCHAR(1000) NOT NULL DEFAULT '',
    "created_by" UUID NOT NULL,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support"."communication_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "type" VARCHAR(20) NOT NULL,
    "recipient" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(255),
    "template_id" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL,
    "provider" VARCHAR(50),
    "provider_id" VARCHAR(255),
    "metadata" JSONB,
    "sent_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "failed_at" TIMESTAMPTZ(6),
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files"."file_storage_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "file_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "content_type" VARCHAR(100) NOT NULL,
    "size" INTEGER NOT NULL,
    "folder" VARCHAR(255),
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "url" TEXT NOT NULL,
    "storage_key" TEXT,
    "status" VARCHAR(20) NOT NULL,
    "user_id" UUID,
    "metadata" JSONB,
    "provider" VARCHAR(50),
    "uploaded_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "error_message" TEXT,
    "processing_time_ms" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_storage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support"."notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMPTZ(6),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "plan_id" UUID,
    "status" "payments"."SubscriptionStatus" NOT NULL DEFAULT 'active',
    "current_period_start" TIMESTAMPTZ(6),
    "current_period_end" TIMESTAMPTZ(6),
    "trial_end" TIMESTAMPTZ(6),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "stripe_price_id" TEXT,
    "start_date" TIMESTAMPTZ(6),
    "end_date" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support"."problems" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "support"."ProblemStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "support"."ProblemPriority" NOT NULL DEFAULT 'MEDIUM',
    "type" "support"."ProblemType" NOT NULL DEFAULT 'GENERAL',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),
    "ticket_number" VARCHAR(20),
    "assigned_to" UUID,
    "files" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."subscription_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "interval" TEXT NOT NULL,
    "interval_count" INTEGER NOT NULL DEFAULT 1,
    "trial_period_days" INTEGER,
    "features" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "stripe_product_id" TEXT,
    "stripe_price_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support"."support_comments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "problem_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "i18n"."languages" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'ltr',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "i18n"."translations" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "context" TEXT,
    "service" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "i18n"."user_language_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_language_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone_number" VARCHAR(50),
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "avatar_url" VARCHAR(1000),
    "role" "identity"."UserRole" NOT NULL DEFAULT 'customer',
    "status" "identity"."UserStatus" NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "date_of_birth" DATE,
    "stripe_user_id" VARCHAR(255),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files"."voucher_books" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "edition" VARCHAR(100),
    "book_type" "files"."VoucherBookType" NOT NULL DEFAULT 'monthly',
    "month" INTEGER,
    "year" INTEGER NOT NULL,
    "status" "files"."VoucherBookStatus" NOT NULL DEFAULT 'draft',
    "total_pages" INTEGER NOT NULL DEFAULT 24,
    "published_at" TIMESTAMPTZ(6),
    "cover_image_url" VARCHAR(500),
    "back_image_url" VARCHAR(500),
    "pdf_url" VARCHAR(500),
    "pdf_generated_at" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "created_by" UUID NOT NULL,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "voucher_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files"."voucher_book_pages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "book_id" UUID NOT NULL,
    "page_number" INTEGER NOT NULL,
    "layout_type" "files"."PageLayoutType" NOT NULL DEFAULT 'standard',
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_book_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files"."ad_placements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "page_id" UUID NOT NULL,
    "content_type" "files"."ContentType" NOT NULL DEFAULT 'voucher',
    "position" INTEGER NOT NULL,
    "size" "files"."AdSize" NOT NULL DEFAULT 'single',
    "spaces_used" INTEGER NOT NULL DEFAULT 1,
    "image_url" VARCHAR(500),
    "qr_code_payload" TEXT,
    "short_code" VARCHAR(20),
    "title" VARCHAR(255),
    "description" TEXT,
    "metadata" JSONB,
    "created_by" UUID NOT NULL,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files"."book_distributions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "book_id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "business_name" VARCHAR(255) NOT NULL,
    "location_id" UUID,
    "location_name" VARCHAR(255),
    "quantity" INTEGER NOT NULL,
    "distribution_type" VARCHAR(50) NOT NULL,
    "contact_name" VARCHAR(255) NOT NULL,
    "contact_email" VARCHAR(255),
    "contact_phone" VARCHAR(50),
    "delivery_address" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "shipped_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "tracking_number" VARCHAR(255),
    "shipping_carrier" VARCHAR(100),
    "notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "book_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."vouchers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "business_id" UUID NOT NULL,
    "category_id" UUID,
    "state" "business"."VoucherState" NOT NULL DEFAULT 'draft',
    "title_key" VARCHAR(255) NOT NULL,
    "description_key" VARCHAR(255) NOT NULL,
    "terms_and_conditions_key" VARCHAR(255) NOT NULL,
    "type" "business"."VoucherType" NOT NULL,
    "value" DECIMAL(10,2),
    "discount" DECIMAL(5,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'PYG',
    "location" geography(Point, 4326),
    "image_url" VARCHAR(500),
    "valid_from" TIMESTAMPTZ(6),
    "valid_until" TIMESTAMPTZ(6),
    "max_redemptions" INTEGER,
    "max_redemptions_per_user" INTEGER NOT NULL DEFAULT 1,
    "redemptions_count" INTEGER NOT NULL DEFAULT 0,
    "scan_count" INTEGER NOT NULL DEFAULT 0,
    "claim_count" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "qr_code" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."voucher_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "voucher_id" UUID NOT NULL,
    "code" VARCHAR(500) NOT NULL,
    "type" "business"."VoucherCodeType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."voucher_redemptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "voucher_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code_used" VARCHAR(500) NOT NULL,
    "redeemed_at" TIMESTAMPTZ(6) NOT NULL,
    "location" geography(Point, 4326),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."customer_vouchers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "voucher_id" UUID NOT NULL,
    "claimed_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "business"."CustomerVoucherStatus" NOT NULL DEFAULT 'claimed',
    "notification_preferences" JSONB,
    "redeemed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."voucher_scans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "voucher_id" UUID NOT NULL,
    "user_id" UUID,
    "scan_type" "analytics"."VoucherScanType" NOT NULL,
    "scan_source" "analytics"."VoucherScanSource" NOT NULL,
    "location" geography(Point, 4326),
    "device_info" JSONB NOT NULL DEFAULT '{}',
    "business_id" UUID,
    "scanned_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "voucher_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security"."fraud_cases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "case_number" VARCHAR(20) NOT NULL,
    "redemption_id" UUID NOT NULL,
    "detected_at" TIMESTAMPTZ(6) NOT NULL,
    "risk_score" INTEGER NOT NULL,
    "flags" JSONB NOT NULL,
    "detection_metadata" JSONB,
    "customer_id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "voucher_id" UUID NOT NULL,
    "status" "security"."FraudCaseStatus" NOT NULL DEFAULT 'pending',
    "reviewed_at" TIMESTAMPTZ(6),
    "reviewed_by" UUID,
    "review_notes" TEXT,
    "actions_taken" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security"."fraud_case_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "case_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "notes" TEXT,
    "performed_by" UUID NOT NULL,
    "performed_at" TIMESTAMPTZ(6) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_case_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "addresses_user_id_idx" ON "users"."addresses"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit"."audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit"."audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit"."audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_user_id_key" ON "identity"."user_identities"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_firebase_uid_key" ON "identity"."user_identities"("firebase_uid");

-- CreateIndex
CREATE INDEX "user_identities_user_id_idx" ON "identity"."user_identities"("user_id");

-- CreateIndex
CREATE INDEX "user_identities_provider_provider_id_idx" ON "identity"."user_identities"("provider", "provider_id");

-- CreateIndex
CREATE INDEX "user_identities_firebase_uid_idx" ON "identity"."user_identities"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_provider_provider_id_key" ON "identity"."user_identities"("provider", "provider_id");

-- CreateIndex
CREATE INDEX "user_auth_methods_user_id_idx" ON "identity"."user_auth_methods"("user_id");

-- CreateIndex
CREATE INDEX "user_auth_methods_auth_method_idx" ON "identity"."user_auth_methods"("auth_method");

-- CreateIndex
CREATE INDEX "user_auth_methods_user_id_is_enabled_last_used_at_idx" ON "identity"."user_auth_methods"("user_id", "is_enabled", "last_used_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_auth_methods_user_id_auth_method_key" ON "identity"."user_auth_methods"("user_id", "auth_method");

-- CreateIndex
CREATE INDEX "user_devices_user_id_idx" ON "identity"."user_devices"("user_id");

-- CreateIndex
CREATE INDEX "user_devices_user_id_last_active_at_idx" ON "identity"."user_devices"("user_id", "last_active_at");

-- CreateIndex
CREATE INDEX "user_devices_user_id_is_trusted_trust_expires_at_idx" ON "identity"."user_devices"("user_id", "is_trusted", "trust_expires_at");

-- CreateIndex
CREATE INDEX "user_devices_fcm_token_idx" ON "identity"."user_devices"("fcm_token");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_user_id_device_id_key" ON "identity"."user_devices"("user_id", "device_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_mfa_settings_user_id_key" ON "identity"."user_mfa_settings"("user_id");

-- CreateIndex
CREATE INDEX "user_mfa_settings_user_id_idx" ON "identity"."user_mfa_settings"("user_id");

-- CreateIndex
CREATE INDEX "user_mfa_settings_user_id_is_enabled_idx" ON "identity"."user_mfa_settings"("user_id", "is_enabled");

-- CreateIndex
CREATE INDEX "security_events_user_id_idx" ON "identity"."security_events"("user_id");

-- CreateIndex
CREATE INDEX "security_events_event_type_idx" ON "identity"."security_events"("event_type");

-- CreateIndex
CREATE INDEX "security_events_created_at_idx" ON "identity"."security_events"("created_at");

-- CreateIndex
CREATE INDEX "security_events_risk_score_created_at_idx" ON "identity"."security_events"("risk_score", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "businesses_user_id_key" ON "marketplace"."businesses"("user_id");

-- CreateIndex
CREATE INDEX "businesses_category_id_idx" ON "marketplace"."businesses"("category_id");

-- CreateIndex
CREATE INDEX "businesses_verified_active_idx" ON "marketplace"."businesses"("verified", "active");

-- CreateIndex
CREATE INDEX "businesses_avg_rating_idx" ON "marketplace"."businesses"("avg_rating");

-- CreateIndex
CREATE INDEX "businesses_deleted_at_idx" ON "marketplace"."businesses"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "catalog"."categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "catalog"."categories"("parent_id");

-- CreateIndex
CREATE INDEX "categories_is_active_deleted_at_idx" ON "catalog"."categories"("is_active", "deleted_at");

-- CreateIndex
CREATE INDEX "categories_sort_order_idx" ON "catalog"."categories"("sort_order");

-- CreateIndex
CREATE INDEX "categories_name_key_idx" ON "catalog"."categories"("name_key");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "catalog"."categories"("slug");

-- CreateIndex
CREATE INDEX "categories_level_idx" ON "catalog"."categories"("level");

-- CreateIndex
CREATE INDEX "categories_path_idx" ON "catalog"."categories"("path");

-- CreateIndex
CREATE INDEX "categories_parent_id_is_active_deleted_at_idx" ON "catalog"."categories"("parent_id", "is_active", "deleted_at");

-- CreateIndex
CREATE INDEX "categories_level_sort_order_idx" ON "catalog"."categories"("level", "sort_order");

-- CreateIndex
CREATE INDEX "communication_logs_user_id_idx" ON "support"."communication_logs"("user_id");

-- CreateIndex
CREATE INDEX "communication_logs_type_status_idx" ON "support"."communication_logs"("type", "status");

-- CreateIndex
CREATE INDEX "communication_logs_recipient_idx" ON "support"."communication_logs"("recipient");

-- CreateIndex
CREATE INDEX "communication_logs_created_at_idx" ON "support"."communication_logs"("created_at");

-- CreateIndex
CREATE INDEX "communication_logs_template_id_idx" ON "support"."communication_logs"("template_id");

-- CreateIndex
CREATE INDEX "file_storage_logs_user_id_idx" ON "files"."file_storage_logs"("user_id");

-- CreateIndex
CREATE INDEX "file_storage_logs_file_id_idx" ON "files"."file_storage_logs"("file_id");

-- CreateIndex
CREATE INDEX "file_storage_logs_status_idx" ON "files"."file_storage_logs"("status");

-- CreateIndex
CREATE INDEX "file_storage_logs_folder_idx" ON "files"."file_storage_logs"("folder");

-- CreateIndex
CREATE INDEX "file_storage_logs_content_type_idx" ON "files"."file_storage_logs"("content_type");

-- CreateIndex
CREATE INDEX "file_storage_logs_created_at_idx" ON "files"."file_storage_logs"("created_at");

-- CreateIndex
CREATE INDEX "file_storage_logs_is_public_idx" ON "files"."file_storage_logs"("is_public");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "support"."notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "support"."notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "support"."notifications"("type");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "payments"."subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "payments"."subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "payments"."subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_stripe_subscription_id_idx" ON "payments"."subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "subscriptions_plan_id_idx" ON "payments"."subscriptions"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "problems_ticket_number_key" ON "support"."problems"("ticket_number");

-- CreateIndex
CREATE INDEX "problems_user_id_idx" ON "support"."problems"("user_id");

-- CreateIndex
CREATE INDEX "problems_status_idx" ON "support"."problems"("status");

-- CreateIndex
CREATE INDEX "problems_priority_idx" ON "support"."problems"("priority");

-- CreateIndex
CREATE INDEX "problems_type_idx" ON "support"."problems"("type");

-- CreateIndex
CREATE INDEX "problems_assigned_to_idx" ON "support"."problems"("assigned_to");

-- CreateIndex
CREATE INDEX "problems_ticket_number_idx" ON "support"."problems"("ticket_number");

-- CreateIndex
CREATE INDEX "problems_created_at_idx" ON "support"."problems"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_name_key" ON "payments"."subscription_plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_stripe_product_id_key" ON "payments"."subscription_plans"("stripe_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_stripe_price_id_key" ON "payments"."subscription_plans"("stripe_price_id");

-- CreateIndex
CREATE INDEX "subscription_plans_is_active_idx" ON "payments"."subscription_plans"("is_active");

-- CreateIndex
CREATE INDEX "subscription_plans_interval_idx" ON "payments"."subscription_plans"("interval");

-- CreateIndex
CREATE INDEX "support_comments_problem_id_idx" ON "support"."support_comments"("problem_id");

-- CreateIndex
CREATE INDEX "support_comments_user_id_idx" ON "support"."support_comments"("user_id");

-- CreateIndex
CREATE INDEX "support_comments_created_at_idx" ON "support"."support_comments"("created_at");

-- CreateIndex
CREATE INDEX "translations_key_languageCode_idx" ON "i18n"."translations"("key", "languageCode");

-- CreateIndex
CREATE INDEX "translations_service_key_idx" ON "i18n"."translations"("service", "key");

-- CreateIndex
CREATE UNIQUE INDEX "translations_key_languageCode_key" ON "i18n"."translations"("key", "languageCode");

-- CreateIndex
CREATE UNIQUE INDEX "user_language_preferences_userId_key" ON "i18n"."user_language_preferences"("userId");

-- CreateIndex
CREATE INDEX "user_language_preferences_userId_idx" ON "i18n"."user_language_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"."users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"."users"("email");

-- CreateIndex
CREATE INDEX "users_phone_number_idx" ON "users"."users"("phone_number");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"."users"("deleted_at");

-- CreateIndex
CREATE INDEX "voucher_books_status_idx" ON "files"."voucher_books"("status");

-- CreateIndex
CREATE INDEX "voucher_books_year_month_idx" ON "files"."voucher_books"("year", "month");

-- CreateIndex
CREATE INDEX "voucher_books_book_type_idx" ON "files"."voucher_books"("book_type");

-- CreateIndex
CREATE INDEX "voucher_books_edition_idx" ON "files"."voucher_books"("edition");

-- CreateIndex
CREATE INDEX "voucher_books_status_year_month_idx" ON "files"."voucher_books"("status", "year", "month");

-- CreateIndex
CREATE INDEX "voucher_books_book_type_status_idx" ON "files"."voucher_books"("book_type", "status");

-- CreateIndex
CREATE INDEX "voucher_books_pdf_generated_at_idx" ON "files"."voucher_books"("pdf_generated_at");

-- CreateIndex
CREATE INDEX "voucher_books_published_at_idx" ON "files"."voucher_books"("published_at");

-- CreateIndex
CREATE INDEX "voucher_books_created_at_idx" ON "files"."voucher_books"("created_at");

-- CreateIndex
CREATE INDEX "voucher_books_deleted_at_idx" ON "files"."voucher_books"("deleted_at");

-- CreateIndex
CREATE INDEX "voucher_books_created_by_idx" ON "files"."voucher_books"("created_by");

-- CreateIndex
CREATE INDEX "voucher_books_updated_by_idx" ON "files"."voucher_books"("updated_by");

-- CreateIndex
CREATE INDEX "voucher_book_pages_book_id_idx" ON "files"."voucher_book_pages"("book_id");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_book_pages_book_id_page_number_key" ON "files"."voucher_book_pages"("book_id", "page_number");

-- CreateIndex
CREATE INDEX "ad_placements_page_id_idx" ON "files"."ad_placements"("page_id");

-- CreateIndex
CREATE INDEX "ad_placements_content_type_idx" ON "files"."ad_placements"("content_type");

-- CreateIndex
CREATE INDEX "ad_placements_created_by_idx" ON "files"."ad_placements"("created_by");

-- CreateIndex
CREATE INDEX "ad_placements_updated_by_idx" ON "files"."ad_placements"("updated_by");

-- CreateIndex
CREATE UNIQUE INDEX "ad_placements_page_id_position_key" ON "files"."ad_placements"("page_id", "position");

-- CreateIndex
CREATE INDEX "book_distributions_book_id_idx" ON "files"."book_distributions"("book_id");

-- CreateIndex
CREATE INDEX "book_distributions_business_id_idx" ON "files"."book_distributions"("business_id");

-- CreateIndex
CREATE INDEX "book_distributions_location_id_idx" ON "files"."book_distributions"("location_id");

-- CreateIndex
CREATE INDEX "book_distributions_status_idx" ON "files"."book_distributions"("status");

-- CreateIndex
CREATE INDEX "book_distributions_shipped_at_idx" ON "files"."book_distributions"("shipped_at");

-- CreateIndex
CREATE INDEX "book_distributions_delivered_at_idx" ON "files"."book_distributions"("delivered_at");

-- CreateIndex
CREATE INDEX "book_distributions_created_at_idx" ON "files"."book_distributions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_qr_code_key" ON "business"."vouchers"("qr_code");

-- CreateIndex
CREATE INDEX "vouchers_business_id_idx" ON "business"."vouchers"("business_id");

-- CreateIndex
CREATE INDEX "vouchers_category_id_idx" ON "business"."vouchers"("category_id");

-- CreateIndex
CREATE INDEX "vouchers_state_idx" ON "business"."vouchers"("state");

-- CreateIndex
CREATE INDEX "vouchers_type_idx" ON "business"."vouchers"("type");

-- CreateIndex
CREATE INDEX "vouchers_valid_from_idx" ON "business"."vouchers"("valid_from");

-- CreateIndex
CREATE INDEX "vouchers_valid_until_idx" ON "business"."vouchers"("valid_until");

-- CreateIndex
CREATE INDEX "vouchers_created_at_idx" ON "business"."vouchers"("created_at");

-- CreateIndex
CREATE INDEX "vouchers_updated_at_idx" ON "business"."vouchers"("updated_at");

-- CreateIndex
CREATE INDEX "vouchers_deleted_at_idx" ON "business"."vouchers"("deleted_at");

-- CreateIndex
CREATE INDEX "vouchers_qr_code_idx" ON "business"."vouchers"("qr_code");

-- CreateIndex
CREATE INDEX "vouchers_state_business_id_idx" ON "business"."vouchers"("state", "business_id");

-- CreateIndex
CREATE INDEX "vouchers_state_valid_until_idx" ON "business"."vouchers"("state", "valid_until");

-- CreateIndex
CREATE INDEX "vouchers_business_id_created_at_idx" ON "business"."vouchers"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "vouchers_category_id_state_idx" ON "business"."vouchers"("category_id", "state");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_codes_code_key" ON "business"."voucher_codes"("code");

-- CreateIndex
CREATE INDEX "voucher_codes_voucher_id_idx" ON "business"."voucher_codes"("voucher_id");

-- CreateIndex
CREATE INDEX "voucher_codes_type_idx" ON "business"."voucher_codes"("type");

-- CreateIndex
CREATE INDEX "voucher_codes_is_active_idx" ON "business"."voucher_codes"("is_active");

-- CreateIndex
CREATE INDEX "voucher_codes_code_idx" ON "business"."voucher_codes"("code");

-- CreateIndex
CREATE INDEX "voucher_codes_voucher_id_type_idx" ON "business"."voucher_codes"("voucher_id", "type");

-- CreateIndex
CREATE INDEX "voucher_codes_voucher_id_is_active_idx" ON "business"."voucher_codes"("voucher_id", "is_active");

-- CreateIndex
CREATE INDEX "voucher_redemptions_voucher_id_idx" ON "business"."voucher_redemptions"("voucher_id");

-- CreateIndex
CREATE INDEX "voucher_redemptions_user_id_idx" ON "business"."voucher_redemptions"("user_id");

-- CreateIndex
CREATE INDEX "voucher_redemptions_redeemed_at_idx" ON "business"."voucher_redemptions"("redeemed_at");

-- CreateIndex
CREATE INDEX "voucher_redemptions_code_used_idx" ON "business"."voucher_redemptions"("code_used");

-- CreateIndex
CREATE INDEX "voucher_redemptions_voucher_id_redeemed_at_idx" ON "business"."voucher_redemptions"("voucher_id", "redeemed_at");

-- CreateIndex
CREATE INDEX "voucher_redemptions_user_id_redeemed_at_idx" ON "business"."voucher_redemptions"("user_id", "redeemed_at");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_redemptions_voucher_id_user_id_key" ON "business"."voucher_redemptions"("voucher_id", "user_id");

-- CreateIndex
CREATE INDEX "customer_vouchers_customer_id_idx" ON "business"."customer_vouchers"("customer_id");

-- CreateIndex
CREATE INDEX "customer_vouchers_voucher_id_idx" ON "business"."customer_vouchers"("voucher_id");

-- CreateIndex
CREATE INDEX "customer_vouchers_status_idx" ON "business"."customer_vouchers"("status");

-- CreateIndex
CREATE INDEX "customer_vouchers_claimed_at_idx" ON "business"."customer_vouchers"("claimed_at");

-- CreateIndex
CREATE INDEX "customer_vouchers_redeemed_at_idx" ON "business"."customer_vouchers"("redeemed_at");

-- CreateIndex
CREATE INDEX "customer_vouchers_customer_id_status_idx" ON "business"."customer_vouchers"("customer_id", "status");

-- CreateIndex
CREATE INDEX "customer_vouchers_voucher_id_status_idx" ON "business"."customer_vouchers"("voucher_id", "status");

-- CreateIndex
CREATE INDEX "customer_vouchers_customer_id_claimed_at_idx" ON "business"."customer_vouchers"("customer_id", "claimed_at");

-- CreateIndex
CREATE UNIQUE INDEX "customer_vouchers_customer_id_voucher_id_key" ON "business"."customer_vouchers"("customer_id", "voucher_id");

-- CreateIndex
CREATE INDEX "voucher_scans_voucher_id_idx" ON "analytics"."voucher_scans"("voucher_id");

-- CreateIndex
CREATE INDEX "voucher_scans_user_id_idx" ON "analytics"."voucher_scans"("user_id");

-- CreateIndex
CREATE INDEX "voucher_scans_business_id_idx" ON "analytics"."voucher_scans"("business_id");

-- CreateIndex
CREATE INDEX "voucher_scans_scan_type_idx" ON "analytics"."voucher_scans"("scan_type");

-- CreateIndex
CREATE INDEX "voucher_scans_scan_source_idx" ON "analytics"."voucher_scans"("scan_source");

-- CreateIndex
CREATE INDEX "voucher_scans_scanned_at_idx" ON "analytics"."voucher_scans"("scanned_at");

-- CreateIndex
CREATE INDEX "voucher_scans_voucher_id_scanned_at_idx" ON "analytics"."voucher_scans"("voucher_id", "scanned_at");

-- CreateIndex
CREATE INDEX "voucher_scans_user_id_scanned_at_idx" ON "analytics"."voucher_scans"("user_id", "scanned_at");

-- CreateIndex
CREATE INDEX "voucher_scans_business_id_scanned_at_idx" ON "analytics"."voucher_scans"("business_id", "scanned_at");

-- CreateIndex
CREATE INDEX "voucher_scans_voucher_id_scan_type_idx" ON "analytics"."voucher_scans"("voucher_id", "scan_type");

-- CreateIndex
CREATE INDEX "voucher_scans_scan_source_scanned_at_idx" ON "analytics"."voucher_scans"("scan_source", "scanned_at");

-- CreateIndex
CREATE UNIQUE INDEX "fraud_cases_case_number_key" ON "security"."fraud_cases"("case_number");

-- CreateIndex
CREATE UNIQUE INDEX "fraud_cases_redemption_id_key" ON "security"."fraud_cases"("redemption_id");

-- CreateIndex
CREATE INDEX "fraud_cases_status_idx" ON "security"."fraud_cases"("status");

-- CreateIndex
CREATE INDEX "fraud_cases_detected_at_idx" ON "security"."fraud_cases"("detected_at");

-- CreateIndex
CREATE INDEX "fraud_cases_risk_score_idx" ON "security"."fraud_cases"("risk_score");

-- CreateIndex
CREATE INDEX "fraud_cases_customer_id_idx" ON "security"."fraud_cases"("customer_id");

-- CreateIndex
CREATE INDEX "fraud_cases_business_id_idx" ON "security"."fraud_cases"("business_id");

-- CreateIndex
CREATE INDEX "fraud_cases_voucher_id_idx" ON "security"."fraud_cases"("voucher_id");

-- CreateIndex
CREATE INDEX "fraud_cases_reviewed_by_idx" ON "security"."fraud_cases"("reviewed_by");

-- CreateIndex
CREATE INDEX "fraud_cases_case_number_idx" ON "security"."fraud_cases"("case_number");

-- CreateIndex
CREATE INDEX "fraud_cases_status_detected_at_idx" ON "security"."fraud_cases"("status", "detected_at");

-- CreateIndex
CREATE INDEX "fraud_cases_customer_id_status_idx" ON "security"."fraud_cases"("customer_id", "status");

-- CreateIndex
CREATE INDEX "fraud_cases_business_id_status_idx" ON "security"."fraud_cases"("business_id", "status");

-- CreateIndex
CREATE INDEX "fraud_cases_risk_score_status_idx" ON "security"."fraud_cases"("risk_score", "status");

-- CreateIndex
CREATE INDEX "fraud_case_history_case_id_idx" ON "security"."fraud_case_history"("case_id");

-- CreateIndex
CREATE INDEX "fraud_case_history_performed_by_idx" ON "security"."fraud_case_history"("performed_by");

-- CreateIndex
CREATE INDEX "fraud_case_history_performed_at_idx" ON "security"."fraud_case_history"("performed_at");

-- CreateIndex
CREATE INDEX "fraud_case_history_action_idx" ON "security"."fraud_case_history"("action");

-- CreateIndex
CREATE INDEX "fraud_case_history_case_id_performed_at_idx" ON "security"."fraud_case_history"("case_id", "performed_at");

-- AddForeignKey
ALTER TABLE "users"."addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."user_identities" ADD CONSTRAINT "user_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."user_auth_methods" ADD CONSTRAINT "user_auth_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."user_devices" ADD CONSTRAINT "user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."user_mfa_settings" ADD CONSTRAINT "user_mfa_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."security_events" ADD CONSTRAINT "security_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."security_events" ADD CONSTRAINT "security_events_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "identity"."user_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."businesses" ADD CONSTRAINT "businesses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."businesses" ADD CONSTRAINT "businesses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "catalog"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "catalog"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."communication_logs" ADD CONSTRAINT "communication_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files"."file_storage_logs" ADD CONSTRAINT "file_storage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "payments"."subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."problems" ADD CONSTRAINT "problems_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."problems" ADD CONSTRAINT "problems_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."support_comments" ADD CONSTRAINT "support_comments_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "support"."problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."support_comments" ADD CONSTRAINT "support_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "i18n"."translations" ADD CONSTRAINT "translations_languageCode_fkey" FOREIGN KEY ("languageCode") REFERENCES "i18n"."languages"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "i18n"."user_language_preferences" ADD CONSTRAINT "user_language_preferences_languageCode_fkey" FOREIGN KEY ("languageCode") REFERENCES "i18n"."languages"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files"."voucher_books" ADD CONSTRAINT "voucher_books_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files"."voucher_books" ADD CONSTRAINT "voucher_books_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files"."voucher_book_pages" ADD CONSTRAINT "voucher_book_pages_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "files"."voucher_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files"."ad_placements" ADD CONSTRAINT "ad_placements_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "files"."voucher_book_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files"."ad_placements" ADD CONSTRAINT "ad_placements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files"."ad_placements" ADD CONSTRAINT "ad_placements_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files"."book_distributions" ADD CONSTRAINT "book_distributions_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "files"."voucher_books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files"."book_distributions" ADD CONSTRAINT "book_distributions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files"."book_distributions" ADD CONSTRAINT "book_distributions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."vouchers" ADD CONSTRAINT "vouchers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "marketplace"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."vouchers" ADD CONSTRAINT "vouchers_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "catalog"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."voucher_codes" ADD CONSTRAINT "voucher_codes_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "business"."vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "business"."vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."customer_vouchers" ADD CONSTRAINT "customer_vouchers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."customer_vouchers" ADD CONSTRAINT "customer_vouchers_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "business"."vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics"."voucher_scans" ADD CONSTRAINT "voucher_scans_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "business"."vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics"."voucher_scans" ADD CONSTRAINT "voucher_scans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics"."voucher_scans" ADD CONSTRAINT "voucher_scans_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "marketplace"."businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security"."fraud_cases" ADD CONSTRAINT "fraud_cases_redemption_id_fkey" FOREIGN KEY ("redemption_id") REFERENCES "business"."voucher_redemptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security"."fraud_cases" ADD CONSTRAINT "fraud_cases_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security"."fraud_cases" ADD CONSTRAINT "fraud_cases_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "marketplace"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security"."fraud_cases" ADD CONSTRAINT "fraud_cases_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "business"."vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security"."fraud_cases" ADD CONSTRAINT "fraud_cases_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security"."fraud_case_history" ADD CONSTRAINT "fraud_case_history_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "security"."fraud_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security"."fraud_case_history" ADD CONSTRAINT "fraud_case_history_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
