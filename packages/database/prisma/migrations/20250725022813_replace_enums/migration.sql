/*
  Warnings:

  - The values [CREATE,UPDATE,DELETE,LOGIN,LOGOUT,STATUS_CHANGE] on the enum `AuditAction` will be removed. If these variants are still used in the database, this will fail.
  - The values [IMAGE,VIDEO,DOCUMENT,AUDIO,OTHER] on the enum `FileType` will be removed. If these variants are still used in the database, this will fail.
  - The values [AWS_S3,LOCAL,MINIO] on the enum `StorageProvider` will be removed. If these variants are still used in the database, this will fail.
  - The values [incompleteExpired,pastDue] on the enum `SubscriptionStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [EMAIL,SMS,PUSH,IN_APP] on the enum `CommunicationMethod` will be removed. If these variants are still used in the database, this will fail.
  - The values [PENDING,SENT,FAILED,READ] on the enum `NotificationStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [EMAIL,SMS,PUSH,IN_APP] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - The values [LOW,MEDIUM,HIGH,URGENT,CRITICAL] on the enum `ProblemPriority` will be removed. If these variants are still used in the database, this will fail.
  - The values [OPEN,ASSIGNED,IN_PROGRESS,WAITING_CUSTOMER,WAITING_INTERNAL,RESOLVED,CLOSED] on the enum `ProblemStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [BILLING,TECHNICAL,ACCOUNT,GENERAL,BUG_REPORT,FEATURE_REQUEST] on the enum `ProblemType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "audit"."AuditAction_new" AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'status_change');
ALTER TABLE "audit"."audit_logs" ALTER COLUMN "action" TYPE "audit"."AuditAction_new" USING ("action"::text::"audit"."AuditAction_new");
ALTER TYPE "audit"."AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "audit"."AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "audit"."AuditAction_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "files"."FileType_new" AS ENUM ('image', 'video', 'document', 'audio', 'other');
ALTER TYPE "files"."FileType" RENAME TO "FileType_old";
ALTER TYPE "files"."FileType_new" RENAME TO "FileType";
DROP TYPE "files"."FileType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "files"."StorageProvider_new" AS ENUM ('aws_s3', 'local', 'minio');
ALTER TYPE "files"."StorageProvider" RENAME TO "StorageProvider_old";
ALTER TYPE "files"."StorageProvider_new" RENAME TO "StorageProvider";
DROP TYPE "files"."StorageProvider_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "payments"."SubscriptionStatus_new" AS ENUM ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid');
ALTER TABLE "payments"."subscriptions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "payments"."subscriptions" ALTER COLUMN "status" TYPE "payments"."SubscriptionStatus_new" USING ("status"::text::"payments"."SubscriptionStatus_new");
ALTER TYPE "payments"."SubscriptionStatus" RENAME TO "SubscriptionStatus_old";
ALTER TYPE "payments"."SubscriptionStatus_new" RENAME TO "SubscriptionStatus";
DROP TYPE "payments"."SubscriptionStatus_old";
ALTER TABLE "payments"."subscriptions" ALTER COLUMN "status" SET DEFAULT 'active';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "support"."CommunicationMethod_new" AS ENUM ('email', 'sms', 'push', 'in_app');
ALTER TYPE "support"."CommunicationMethod" RENAME TO "CommunicationMethod_old";
ALTER TYPE "support"."CommunicationMethod_new" RENAME TO "CommunicationMethod";
DROP TYPE "support"."CommunicationMethod_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "support"."NotificationStatus_new" AS ENUM ('pending', 'sent', 'failed', 'read');
ALTER TYPE "support"."NotificationStatus" RENAME TO "NotificationStatus_old";
ALTER TYPE "support"."NotificationStatus_new" RENAME TO "NotificationStatus";
DROP TYPE "support"."NotificationStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "support"."NotificationType_new" AS ENUM ('email', 'sms', 'push', 'in_app');
ALTER TYPE "support"."NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "support"."NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "support"."NotificationType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "support"."ProblemPriority_new" AS ENUM ('low', 'medium', 'high', 'urgent', 'critical');
ALTER TABLE "support"."problems" ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE "support"."problems" ALTER COLUMN "priority" TYPE "support"."ProblemPriority_new" USING ("priority"::text::"support"."ProblemPriority_new");
ALTER TYPE "support"."ProblemPriority" RENAME TO "ProblemPriority_old";
ALTER TYPE "support"."ProblemPriority_new" RENAME TO "ProblemPriority";
DROP TYPE "support"."ProblemPriority_old";
ALTER TABLE "support"."problems" ALTER COLUMN "priority" SET DEFAULT 'medium';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "support"."ProblemStatus_new" AS ENUM ('open', 'assigned', 'in_progress', 'waiting_customer', 'waiting_internal', 'resolved', 'closed');
ALTER TABLE "support"."problems" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "support"."problems" ALTER COLUMN "status" TYPE "support"."ProblemStatus_new" USING ("status"::text::"support"."ProblemStatus_new");
ALTER TYPE "support"."ProblemStatus" RENAME TO "ProblemStatus_old";
ALTER TYPE "support"."ProblemStatus_new" RENAME TO "ProblemStatus";
DROP TYPE "support"."ProblemStatus_old";
ALTER TABLE "support"."problems" ALTER COLUMN "status" SET DEFAULT 'open';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "support"."ProblemType_new" AS ENUM ('billing', 'technical', 'account', 'general', 'bug_report', 'feature_request');
ALTER TABLE "support"."problems" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "support"."problems" ALTER COLUMN "type" TYPE "support"."ProblemType_new" USING ("type"::text::"support"."ProblemType_new");
ALTER TYPE "support"."ProblemType" RENAME TO "ProblemType_old";
ALTER TYPE "support"."ProblemType_new" RENAME TO "ProblemType";
DROP TYPE "support"."ProblemType_old";
ALTER TABLE "support"."problems" ALTER COLUMN "type" SET DEFAULT 'general';
COMMIT;

-- AlterTable
ALTER TABLE "support"."problems" ALTER COLUMN "status" SET DEFAULT 'open',
ALTER COLUMN "priority" SET DEFAULT 'medium',
ALTER COLUMN "type" SET DEFAULT 'general';
