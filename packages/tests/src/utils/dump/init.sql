--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (Debian 17.5-1.pgdg110+1)
-- Dumped by pg_dump version 17.2 (Debian 17.2-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY users.addresses DROP CONSTRAINT IF EXISTS addresses_user_id_fkey;
ALTER TABLE IF EXISTS ONLY support.support_comments DROP CONSTRAINT IF EXISTS support_comments_user_id_fkey;
ALTER TABLE IF EXISTS ONLY support.support_comments DROP CONSTRAINT IF EXISTS support_comments_problem_id_fkey;
ALTER TABLE IF EXISTS ONLY support.problems DROP CONSTRAINT IF EXISTS problems_user_id_fkey;
ALTER TABLE IF EXISTS ONLY support.problems DROP CONSTRAINT IF EXISTS problems_assigned_to_fkey;
ALTER TABLE IF EXISTS ONLY support.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE IF EXISTS ONLY support.communication_logs DROP CONSTRAINT IF EXISTS communication_logs_user_id_fkey;
ALTER TABLE IF EXISTS ONLY security.fraud_cases DROP CONSTRAINT IF EXISTS fraud_cases_voucher_id_fkey;
ALTER TABLE IF EXISTS ONLY security.fraud_cases DROP CONSTRAINT IF EXISTS fraud_cases_reviewed_by_fkey;
ALTER TABLE IF EXISTS ONLY security.fraud_cases DROP CONSTRAINT IF EXISTS fraud_cases_redemption_id_fkey;
ALTER TABLE IF EXISTS ONLY security.fraud_cases DROP CONSTRAINT IF EXISTS fraud_cases_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY security.fraud_cases DROP CONSTRAINT IF EXISTS fraud_cases_business_id_fkey;
ALTER TABLE IF EXISTS ONLY security.fraud_case_history DROP CONSTRAINT IF EXISTS fraud_case_history_performed_by_fkey;
ALTER TABLE IF EXISTS ONLY security.fraud_case_history DROP CONSTRAINT IF EXISTS fraud_case_history_case_id_fkey;
ALTER TABLE IF EXISTS ONLY payments.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY payments.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.businesses DROP CONSTRAINT IF EXISTS businesses_user_id_fkey;
ALTER TABLE IF EXISTS ONLY marketplace.businesses DROP CONSTRAINT IF EXISTS businesses_category_id_fkey;
ALTER TABLE IF EXISTS ONLY identity.user_mfa_settings DROP CONSTRAINT IF EXISTS user_mfa_settings_user_id_fkey;
ALTER TABLE IF EXISTS ONLY identity.user_identities DROP CONSTRAINT IF EXISTS user_identities_user_id_fkey;
ALTER TABLE IF EXISTS ONLY identity.user_devices DROP CONSTRAINT IF EXISTS user_devices_user_id_fkey;
ALTER TABLE IF EXISTS ONLY identity.user_auth_methods DROP CONSTRAINT IF EXISTS user_auth_methods_user_id_fkey;
ALTER TABLE IF EXISTS ONLY identity.security_events DROP CONSTRAINT IF EXISTS security_events_user_id_fkey;
ALTER TABLE IF EXISTS ONLY identity.security_events DROP CONSTRAINT IF EXISTS security_events_device_id_fkey;
ALTER TABLE IF EXISTS ONLY i18n.user_language_preferences DROP CONSTRAINT IF EXISTS "user_language_preferences_languageCode_fkey";
ALTER TABLE IF EXISTS ONLY i18n.translations DROP CONSTRAINT IF EXISTS "translations_languageCode_fkey";
ALTER TABLE IF EXISTS ONLY files.voucher_books DROP CONSTRAINT IF EXISTS voucher_books_updated_by_fkey;
ALTER TABLE IF EXISTS ONLY files.voucher_books DROP CONSTRAINT IF EXISTS voucher_books_created_by_fkey;
ALTER TABLE IF EXISTS ONLY files.voucher_book_pages DROP CONSTRAINT IF EXISTS voucher_book_pages_book_id_fkey;
ALTER TABLE IF EXISTS ONLY files.file_storage_logs DROP CONSTRAINT IF EXISTS file_storage_logs_user_id_fkey;
ALTER TABLE IF EXISTS ONLY files.book_distributions DROP CONSTRAINT IF EXISTS book_distributions_updated_by_fkey;
ALTER TABLE IF EXISTS ONLY files.book_distributions DROP CONSTRAINT IF EXISTS book_distributions_created_by_fkey;
ALTER TABLE IF EXISTS ONLY files.book_distributions DROP CONSTRAINT IF EXISTS book_distributions_book_id_fkey;
ALTER TABLE IF EXISTS ONLY files.ad_placements DROP CONSTRAINT IF EXISTS ad_placements_updated_by_fkey;
ALTER TABLE IF EXISTS ONLY files.ad_placements DROP CONSTRAINT IF EXISTS ad_placements_page_id_fkey;
ALTER TABLE IF EXISTS ONLY files.ad_placements DROP CONSTRAINT IF EXISTS ad_placements_created_by_fkey;
ALTER TABLE IF EXISTS ONLY catalog.categories DROP CONSTRAINT IF EXISTS categories_parent_id_fkey;
ALTER TABLE IF EXISTS ONLY business.vouchers DROP CONSTRAINT IF EXISTS vouchers_category_id_fkey;
ALTER TABLE IF EXISTS ONLY business.vouchers DROP CONSTRAINT IF EXISTS vouchers_business_id_fkey;
ALTER TABLE IF EXISTS ONLY business.voucher_redemptions DROP CONSTRAINT IF EXISTS voucher_redemptions_voucher_id_fkey;
ALTER TABLE IF EXISTS ONLY business.voucher_redemptions DROP CONSTRAINT IF EXISTS voucher_redemptions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY business.voucher_codes DROP CONSTRAINT IF EXISTS voucher_codes_voucher_id_fkey;
ALTER TABLE IF EXISTS ONLY business.customer_vouchers DROP CONSTRAINT IF EXISTS customer_vouchers_voucher_id_fkey;
ALTER TABLE IF EXISTS ONLY business.customer_vouchers DROP CONSTRAINT IF EXISTS customer_vouchers_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY analytics.voucher_scans DROP CONSTRAINT IF EXISTS voucher_scans_voucher_id_fkey;
ALTER TABLE IF EXISTS ONLY analytics.voucher_scans DROP CONSTRAINT IF EXISTS voucher_scans_user_id_fkey;
ALTER TABLE IF EXISTS ONLY analytics.voucher_scans DROP CONSTRAINT IF EXISTS voucher_scans_business_id_fkey;
DROP INDEX IF EXISTS users.users_phone_number_idx;
DROP INDEX IF EXISTS users.users_email_key;
DROP INDEX IF EXISTS users.users_email_idx;
DROP INDEX IF EXISTS users.users_deleted_at_idx;
DROP INDEX IF EXISTS users.addresses_user_id_idx;
DROP INDEX IF EXISTS support.support_comments_user_id_idx;
DROP INDEX IF EXISTS support.support_comments_problem_id_idx;
DROP INDEX IF EXISTS support.support_comments_created_at_idx;
DROP INDEX IF EXISTS support.problems_user_id_idx;
DROP INDEX IF EXISTS support.problems_type_idx;
DROP INDEX IF EXISTS support.problems_ticket_number_key;
DROP INDEX IF EXISTS support.problems_ticket_number_idx;
DROP INDEX IF EXISTS support.problems_status_idx;
DROP INDEX IF EXISTS support.problems_priority_idx;
DROP INDEX IF EXISTS support.problems_created_at_idx;
DROP INDEX IF EXISTS support.problems_assigned_to_idx;
DROP INDEX IF EXISTS support.notifications_user_id_is_read_idx;
DROP INDEX IF EXISTS support.notifications_user_id_created_at_idx;
DROP INDEX IF EXISTS support.notifications_type_idx;
DROP INDEX IF EXISTS support.communication_logs_user_id_idx;
DROP INDEX IF EXISTS support.communication_logs_type_status_idx;
DROP INDEX IF EXISTS support.communication_logs_template_id_idx;
DROP INDEX IF EXISTS support.communication_logs_recipient_idx;
DROP INDEX IF EXISTS support.communication_logs_created_at_idx;
DROP INDEX IF EXISTS security.fraud_cases_voucher_id_idx;
DROP INDEX IF EXISTS security.fraud_cases_status_idx;
DROP INDEX IF EXISTS security.fraud_cases_status_detected_at_idx;
DROP INDEX IF EXISTS security.fraud_cases_risk_score_status_idx;
DROP INDEX IF EXISTS security.fraud_cases_risk_score_idx;
DROP INDEX IF EXISTS security.fraud_cases_reviewed_by_idx;
DROP INDEX IF EXISTS security.fraud_cases_redemption_id_key;
DROP INDEX IF EXISTS security.fraud_cases_detected_at_idx;
DROP INDEX IF EXISTS security.fraud_cases_customer_id_status_idx;
DROP INDEX IF EXISTS security.fraud_cases_customer_id_idx;
DROP INDEX IF EXISTS security.fraud_cases_case_number_key;
DROP INDEX IF EXISTS security.fraud_cases_case_number_idx;
DROP INDEX IF EXISTS security.fraud_cases_business_id_status_idx;
DROP INDEX IF EXISTS security.fraud_cases_business_id_idx;
DROP INDEX IF EXISTS security.fraud_case_history_performed_by_idx;
DROP INDEX IF EXISTS security.fraud_case_history_performed_at_idx;
DROP INDEX IF EXISTS security.fraud_case_history_case_id_performed_at_idx;
DROP INDEX IF EXISTS security.fraud_case_history_case_id_idx;
DROP INDEX IF EXISTS security.fraud_case_history_action_idx;
DROP INDEX IF EXISTS payments.subscriptions_user_id_idx;
DROP INDEX IF EXISTS payments.subscriptions_stripe_subscription_id_key;
DROP INDEX IF EXISTS payments.subscriptions_stripe_subscription_id_idx;
DROP INDEX IF EXISTS payments.subscriptions_status_idx;
DROP INDEX IF EXISTS payments.subscriptions_plan_id_idx;
DROP INDEX IF EXISTS payments.subscription_plans_stripe_product_id_key;
DROP INDEX IF EXISTS payments.subscription_plans_stripe_price_id_key;
DROP INDEX IF EXISTS payments.subscription_plans_name_key;
DROP INDEX IF EXISTS payments.subscription_plans_is_active_idx;
DROP INDEX IF EXISTS payments.subscription_plans_interval_idx;
DROP INDEX IF EXISTS marketplace.businesses_verified_active_idx;
DROP INDEX IF EXISTS marketplace.businesses_user_id_key;
DROP INDEX IF EXISTS marketplace.businesses_deleted_at_idx;
DROP INDEX IF EXISTS marketplace.businesses_category_id_idx;
DROP INDEX IF EXISTS marketplace.businesses_avg_rating_idx;
DROP INDEX IF EXISTS identity.user_mfa_settings_user_id_key;
DROP INDEX IF EXISTS identity.user_mfa_settings_user_id_is_enabled_idx;
DROP INDEX IF EXISTS identity.user_mfa_settings_user_id_idx;
DROP INDEX IF EXISTS identity.user_identities_user_id_key;
DROP INDEX IF EXISTS identity.user_identities_user_id_idx;
DROP INDEX IF EXISTS identity.user_identities_provider_provider_id_key;
DROP INDEX IF EXISTS identity.user_identities_provider_provider_id_idx;
DROP INDEX IF EXISTS identity.user_identities_firebase_uid_key;
DROP INDEX IF EXISTS identity.user_identities_firebase_uid_idx;
DROP INDEX IF EXISTS identity.user_devices_user_id_last_active_at_idx;
DROP INDEX IF EXISTS identity.user_devices_user_id_is_trusted_trust_expires_at_idx;
DROP INDEX IF EXISTS identity.user_devices_user_id_idx;
DROP INDEX IF EXISTS identity.user_devices_user_id_device_id_key;
DROP INDEX IF EXISTS identity.user_devices_fcm_token_idx;
DROP INDEX IF EXISTS identity.user_auth_methods_user_id_is_enabled_last_used_at_idx;
DROP INDEX IF EXISTS identity.user_auth_methods_user_id_idx;
DROP INDEX IF EXISTS identity.user_auth_methods_user_id_auth_method_key;
DROP INDEX IF EXISTS identity.user_auth_methods_auth_method_idx;
DROP INDEX IF EXISTS identity.security_events_user_id_idx;
DROP INDEX IF EXISTS identity.security_events_risk_score_created_at_idx;
DROP INDEX IF EXISTS identity.security_events_event_type_idx;
DROP INDEX IF EXISTS identity.security_events_created_at_idx;
DROP INDEX IF EXISTS i18n."user_language_preferences_userId_key";
DROP INDEX IF EXISTS i18n."user_language_preferences_userId_idx";
DROP INDEX IF EXISTS i18n.translations_service_key_idx;
DROP INDEX IF EXISTS i18n."translations_key_languageCode_key";
DROP INDEX IF EXISTS i18n."translations_key_languageCode_idx";
DROP INDEX IF EXISTS files.voucher_books_year_month_idx;
DROP INDEX IF EXISTS files.voucher_books_updated_by_idx;
DROP INDEX IF EXISTS files.voucher_books_status_year_month_idx;
DROP INDEX IF EXISTS files.voucher_books_status_idx;
DROP INDEX IF EXISTS files.voucher_books_published_at_idx;
DROP INDEX IF EXISTS files.voucher_books_pdf_generated_at_idx;
DROP INDEX IF EXISTS files.voucher_books_edition_idx;
DROP INDEX IF EXISTS files.voucher_books_deleted_at_idx;
DROP INDEX IF EXISTS files.voucher_books_created_by_idx;
DROP INDEX IF EXISTS files.voucher_books_created_at_idx;
DROP INDEX IF EXISTS files.voucher_books_book_type_status_idx;
DROP INDEX IF EXISTS files.voucher_books_book_type_idx;
DROP INDEX IF EXISTS files.voucher_book_pages_book_id_page_number_key;
DROP INDEX IF EXISTS files.voucher_book_pages_book_id_idx;
DROP INDEX IF EXISTS files.file_storage_logs_user_id_idx;
DROP INDEX IF EXISTS files.file_storage_logs_status_idx;
DROP INDEX IF EXISTS files.file_storage_logs_is_public_idx;
DROP INDEX IF EXISTS files.file_storage_logs_folder_idx;
DROP INDEX IF EXISTS files.file_storage_logs_file_id_idx;
DROP INDEX IF EXISTS files.file_storage_logs_created_at_idx;
DROP INDEX IF EXISTS files.file_storage_logs_content_type_idx;
DROP INDEX IF EXISTS files.book_distributions_status_idx;
DROP INDEX IF EXISTS files.book_distributions_shipped_at_idx;
DROP INDEX IF EXISTS files.book_distributions_location_id_idx;
DROP INDEX IF EXISTS files.book_distributions_delivered_at_idx;
DROP INDEX IF EXISTS files.book_distributions_created_at_idx;
DROP INDEX IF EXISTS files.book_distributions_business_id_idx;
DROP INDEX IF EXISTS files.book_distributions_book_id_idx;
DROP INDEX IF EXISTS files.ad_placements_updated_by_idx;
DROP INDEX IF EXISTS files.ad_placements_page_id_position_key;
DROP INDEX IF EXISTS files.ad_placements_page_id_idx;
DROP INDEX IF EXISTS files.ad_placements_created_by_idx;
DROP INDEX IF EXISTS files.ad_placements_content_type_idx;
DROP INDEX IF EXISTS catalog.categories_sort_order_idx;
DROP INDEX IF EXISTS catalog.categories_slug_key;
DROP INDEX IF EXISTS catalog.categories_slug_idx;
DROP INDEX IF EXISTS catalog.categories_path_idx;
DROP INDEX IF EXISTS catalog.categories_parent_id_is_active_deleted_at_idx;
DROP INDEX IF EXISTS catalog.categories_parent_id_idx;
DROP INDEX IF EXISTS catalog.categories_name_key_idx;
DROP INDEX IF EXISTS catalog.categories_level_sort_order_idx;
DROP INDEX IF EXISTS catalog.categories_level_idx;
DROP INDEX IF EXISTS catalog.categories_is_active_deleted_at_idx;
DROP INDEX IF EXISTS business.vouchers_valid_until_idx;
DROP INDEX IF EXISTS business.vouchers_valid_from_idx;
DROP INDEX IF EXISTS business.vouchers_updated_at_idx;
DROP INDEX IF EXISTS business.vouchers_type_idx;
DROP INDEX IF EXISTS business.vouchers_state_valid_until_idx;
DROP INDEX IF EXISTS business.vouchers_state_idx;
DROP INDEX IF EXISTS business.vouchers_state_business_id_idx;
DROP INDEX IF EXISTS business.vouchers_qr_code_key;
DROP INDEX IF EXISTS business.vouchers_qr_code_idx;
DROP INDEX IF EXISTS business.vouchers_deleted_at_idx;
DROP INDEX IF EXISTS business.vouchers_created_at_idx;
DROP INDEX IF EXISTS business.vouchers_category_id_state_idx;
DROP INDEX IF EXISTS business.vouchers_category_id_idx;
DROP INDEX IF EXISTS business.vouchers_business_id_idx;
DROP INDEX IF EXISTS business.vouchers_business_id_created_at_idx;
DROP INDEX IF EXISTS business.voucher_redemptions_voucher_id_user_id_key;
DROP INDEX IF EXISTS business.voucher_redemptions_voucher_id_redeemed_at_idx;
DROP INDEX IF EXISTS business.voucher_redemptions_voucher_id_idx;
DROP INDEX IF EXISTS business.voucher_redemptions_user_id_redeemed_at_idx;
DROP INDEX IF EXISTS business.voucher_redemptions_user_id_idx;
DROP INDEX IF EXISTS business.voucher_redemptions_redeemed_at_idx;
DROP INDEX IF EXISTS business.voucher_redemptions_code_used_idx;
DROP INDEX IF EXISTS business.voucher_codes_voucher_id_type_idx;
DROP INDEX IF EXISTS business.voucher_codes_voucher_id_is_active_idx;
DROP INDEX IF EXISTS business.voucher_codes_voucher_id_idx;
DROP INDEX IF EXISTS business.voucher_codes_type_idx;
DROP INDEX IF EXISTS business.voucher_codes_is_active_idx;
DROP INDEX IF EXISTS business.voucher_codes_code_key;
DROP INDEX IF EXISTS business.voucher_codes_code_idx;
DROP INDEX IF EXISTS business.customer_vouchers_voucher_id_status_idx;
DROP INDEX IF EXISTS business.customer_vouchers_voucher_id_idx;
DROP INDEX IF EXISTS business.customer_vouchers_status_idx;
DROP INDEX IF EXISTS business.customer_vouchers_redeemed_at_idx;
DROP INDEX IF EXISTS business.customer_vouchers_customer_id_voucher_id_key;
DROP INDEX IF EXISTS business.customer_vouchers_customer_id_status_idx;
DROP INDEX IF EXISTS business.customer_vouchers_customer_id_idx;
DROP INDEX IF EXISTS business.customer_vouchers_customer_id_claimed_at_idx;
DROP INDEX IF EXISTS business.customer_vouchers_claimed_at_idx;
DROP INDEX IF EXISTS audit.audit_logs_user_id_idx;
DROP INDEX IF EXISTS audit.audit_logs_entity_type_entity_id_idx;
DROP INDEX IF EXISTS audit.audit_logs_created_at_idx;
DROP INDEX IF EXISTS analytics.voucher_scans_voucher_id_scanned_at_idx;
DROP INDEX IF EXISTS analytics.voucher_scans_voucher_id_scan_type_idx;
DROP INDEX IF EXISTS analytics.voucher_scans_voucher_id_idx;
DROP INDEX IF EXISTS analytics.voucher_scans_user_id_scanned_at_idx;
DROP INDEX IF EXISTS analytics.voucher_scans_user_id_idx;
DROP INDEX IF EXISTS analytics.voucher_scans_scanned_at_idx;
DROP INDEX IF EXISTS analytics.voucher_scans_scan_type_idx;
DROP INDEX IF EXISTS analytics.voucher_scans_scan_source_scanned_at_idx;
DROP INDEX IF EXISTS analytics.voucher_scans_scan_source_idx;
DROP INDEX IF EXISTS analytics.voucher_scans_business_id_scanned_at_idx;
DROP INDEX IF EXISTS analytics.voucher_scans_business_id_idx;
ALTER TABLE IF EXISTS ONLY users.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY users.addresses DROP CONSTRAINT IF EXISTS addresses_pkey;
ALTER TABLE IF EXISTS ONLY support.support_comments DROP CONSTRAINT IF EXISTS support_comments_pkey;
ALTER TABLE IF EXISTS ONLY support.problems DROP CONSTRAINT IF EXISTS problems_pkey;
ALTER TABLE IF EXISTS ONLY support.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY support.communication_logs DROP CONSTRAINT IF EXISTS communication_logs_pkey;
ALTER TABLE IF EXISTS ONLY security.fraud_cases DROP CONSTRAINT IF EXISTS fraud_cases_pkey;
ALTER TABLE IF EXISTS ONLY security.fraud_case_history DROP CONSTRAINT IF EXISTS fraud_case_history_pkey;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY payments.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_pkey;
ALTER TABLE IF EXISTS ONLY payments.subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_pkey;
ALTER TABLE IF EXISTS ONLY marketplace.businesses DROP CONSTRAINT IF EXISTS businesses_pkey;
ALTER TABLE IF EXISTS ONLY identity.user_mfa_settings DROP CONSTRAINT IF EXISTS user_mfa_settings_pkey;
ALTER TABLE IF EXISTS ONLY identity.user_identities DROP CONSTRAINT IF EXISTS user_identities_pkey;
ALTER TABLE IF EXISTS ONLY identity.user_devices DROP CONSTRAINT IF EXISTS user_devices_pkey;
ALTER TABLE IF EXISTS ONLY identity.user_auth_methods DROP CONSTRAINT IF EXISTS user_auth_methods_pkey;
ALTER TABLE IF EXISTS ONLY identity.security_events DROP CONSTRAINT IF EXISTS security_events_pkey;
ALTER TABLE IF EXISTS ONLY i18n.user_language_preferences DROP CONSTRAINT IF EXISTS user_language_preferences_pkey;
ALTER TABLE IF EXISTS ONLY i18n.translations DROP CONSTRAINT IF EXISTS translations_pkey;
ALTER TABLE IF EXISTS ONLY i18n.languages DROP CONSTRAINT IF EXISTS languages_pkey;
ALTER TABLE IF EXISTS ONLY files.voucher_books DROP CONSTRAINT IF EXISTS voucher_books_pkey;
ALTER TABLE IF EXISTS ONLY files.voucher_book_pages DROP CONSTRAINT IF EXISTS voucher_book_pages_pkey;
ALTER TABLE IF EXISTS ONLY files.file_storage_logs DROP CONSTRAINT IF EXISTS file_storage_logs_pkey;
ALTER TABLE IF EXISTS ONLY files.book_distributions DROP CONSTRAINT IF EXISTS book_distributions_pkey;
ALTER TABLE IF EXISTS ONLY files.ad_placements DROP CONSTRAINT IF EXISTS ad_placements_pkey;
ALTER TABLE IF EXISTS ONLY catalog.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS ONLY business.vouchers DROP CONSTRAINT IF EXISTS vouchers_pkey;
ALTER TABLE IF EXISTS ONLY business.voucher_redemptions DROP CONSTRAINT IF EXISTS voucher_redemptions_pkey;
ALTER TABLE IF EXISTS ONLY business.voucher_codes DROP CONSTRAINT IF EXISTS voucher_codes_pkey;
ALTER TABLE IF EXISTS ONLY business.customer_vouchers DROP CONSTRAINT IF EXISTS customer_vouchers_pkey;
ALTER TABLE IF EXISTS ONLY audit.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY analytics.voucher_scans DROP CONSTRAINT IF EXISTS voucher_scans_pkey;
DROP TABLE IF EXISTS users.users;
DROP TABLE IF EXISTS users.addresses;
DROP TABLE IF EXISTS support.support_comments;
DROP TABLE IF EXISTS support.problems;
DROP TABLE IF EXISTS support.notifications;
DROP TABLE IF EXISTS support.communication_logs;
DROP TABLE IF EXISTS security.fraud_cases;
DROP TABLE IF EXISTS security.fraud_case_history;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TABLE IF EXISTS payments.subscriptions;
DROP TABLE IF EXISTS payments.subscription_plans;
DROP TABLE IF EXISTS marketplace.businesses;
DROP TABLE IF EXISTS identity.user_mfa_settings;
DROP TABLE IF EXISTS identity.user_identities;
DROP TABLE IF EXISTS identity.user_devices;
DROP TABLE IF EXISTS identity.user_auth_methods;
DROP TABLE IF EXISTS identity.security_events;
DROP TABLE IF EXISTS i18n.user_language_preferences;
DROP TABLE IF EXISTS i18n.translations;
DROP TABLE IF EXISTS i18n.languages;
DROP TABLE IF EXISTS files.voucher_books;
DROP TABLE IF EXISTS files.voucher_book_pages;
DROP TABLE IF EXISTS files.file_storage_logs;
DROP TABLE IF EXISTS files.book_distributions;
DROP TABLE IF EXISTS files.ad_placements;
DROP TABLE IF EXISTS catalog.categories;
DROP TABLE IF EXISTS business.vouchers;
DROP TABLE IF EXISTS business.voucher_redemptions;
DROP TABLE IF EXISTS business.voucher_codes;
DROP TABLE IF EXISTS business.customer_vouchers;
DROP TABLE IF EXISTS audit.audit_logs;
DROP TABLE IF EXISTS analytics.voucher_scans;
DROP TYPE IF EXISTS support."ProblemType";
DROP TYPE IF EXISTS support."ProblemStatus";
DROP TYPE IF EXISTS support."ProblemPriority";
DROP TYPE IF EXISTS support."NotificationType";
DROP TYPE IF EXISTS support."NotificationStatus";
DROP TYPE IF EXISTS support."CommunicationMethod";
DROP TYPE IF EXISTS security."FraudCaseStatus";
DROP TYPE IF EXISTS payments."SubscriptionStatus";
DROP TYPE IF EXISTS identity."UserStatus";
DROP TYPE IF EXISTS identity."UserRole";
DROP TYPE IF EXISTS identity."MfaMethod";
DROP TYPE IF EXISTS identity."DeviceType";
DROP TYPE IF EXISTS files."VoucherBookType";
DROP TYPE IF EXISTS files."VoucherBookStatus";
DROP TYPE IF EXISTS files."StorageProvider";
DROP TYPE IF EXISTS files."PageLayoutType";
DROP TYPE IF EXISTS files."FileType";
DROP TYPE IF EXISTS files."ContentType";
DROP TYPE IF EXISTS files."AdSize";
DROP TYPE IF EXISTS business."VoucherType";
DROP TYPE IF EXISTS business."VoucherState";
DROP TYPE IF EXISTS business."VoucherCodeType";
DROP TYPE IF EXISTS business."CustomerVoucherStatus";
DROP TYPE IF EXISTS audit."AuditAction";
DROP TYPE IF EXISTS analytics."VoucherScanType";
DROP TYPE IF EXISTS analytics."VoucherScanSource";
DROP EXTENSION IF EXISTS postgis_topology;
DROP EXTENSION IF EXISTS postgis_tiger_geocoder;
DROP EXTENSION IF EXISTS postgis;
DROP EXTENSION IF EXISTS pgcrypto;
DROP EXTENSION IF EXISTS fuzzystrmatch;
DROP SCHEMA IF EXISTS users;
DROP SCHEMA IF EXISTS topology;
DROP SCHEMA IF EXISTS tiger_data;
DROP SCHEMA IF EXISTS tiger;
DROP SCHEMA IF EXISTS support;
DROP SCHEMA IF EXISTS security;
DROP SCHEMA IF EXISTS payments;
DROP SCHEMA IF EXISTS marketplace;
DROP SCHEMA IF EXISTS identity;
DROP SCHEMA IF EXISTS i18n;
DROP SCHEMA IF EXISTS files;
DROP SCHEMA IF EXISTS catalog;
DROP SCHEMA IF EXISTS business;
DROP SCHEMA IF EXISTS audit;
DROP SCHEMA IF EXISTS analytics;
--
-- Name: analytics; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA analytics;


--
-- Name: audit; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA audit;


--
-- Name: business; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA business;


--
-- Name: catalog; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA catalog;


--
-- Name: files; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA files;


--
-- Name: i18n; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA i18n;


--
-- Name: identity; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA identity;


--
-- Name: marketplace; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA marketplace;


--
-- Name: payments; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA payments;


--
-- Name: security; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA security;


--
-- Name: support; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA support;


--
-- Name: tiger; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA tiger;


--
-- Name: tiger_data; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA tiger_data;


--
-- Name: topology; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA topology;


--
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- Name: users; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA users;


--
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: postgis_tiger_geocoder; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder WITH SCHEMA tiger;


--
-- Name: EXTENSION postgis_tiger_geocoder; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis_tiger_geocoder IS 'PostGIS tiger geocoder and reverse geocoder';


--
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


--
-- Name: VoucherScanSource; Type: TYPE; Schema: analytics; Owner: -
--

CREATE TYPE analytics."VoucherScanSource" AS ENUM (
    'camera',
    'gallery',
    'link',
    'share'
);


--
-- Name: VoucherScanType; Type: TYPE; Schema: analytics; Owner: -
--

CREATE TYPE analytics."VoucherScanType" AS ENUM (
    'customer',
    'business'
);


--
-- Name: AuditAction; Type: TYPE; Schema: audit; Owner: -
--

CREATE TYPE audit."AuditAction" AS ENUM (
    'create',
    'update',
    'delete',
    'login',
    'logout',
    'status_change'
);


--
-- Name: CustomerVoucherStatus; Type: TYPE; Schema: business; Owner: -
--

CREATE TYPE business."CustomerVoucherStatus" AS ENUM (
    'claimed',
    'redeemed',
    'expired'
);


--
-- Name: VoucherCodeType; Type: TYPE; Schema: business; Owner: -
--

CREATE TYPE business."VoucherCodeType" AS ENUM (
    'qr',
    'short',
    'static'
);


--
-- Name: VoucherState; Type: TYPE; Schema: business; Owner: -
--

CREATE TYPE business."VoucherState" AS ENUM (
    'draft',
    'published',
    'claimed',
    'redeemed',
    'expired',
    'suspended'
);


--
-- Name: VoucherType; Type: TYPE; Schema: business; Owner: -
--

CREATE TYPE business."VoucherType" AS ENUM (
    'percentage',
    'fixed'
);


--
-- Name: AdSize; Type: TYPE; Schema: files; Owner: -
--

CREATE TYPE files."AdSize" AS ENUM (
    'single',
    'quarter',
    'half',
    'full'
);


--
-- Name: ContentType; Type: TYPE; Schema: files; Owner: -
--

CREATE TYPE files."ContentType" AS ENUM (
    'voucher',
    'image',
    'ad',
    'sponsored'
);


--
-- Name: FileType; Type: TYPE; Schema: files; Owner: -
--

CREATE TYPE files."FileType" AS ENUM (
    'image',
    'video',
    'document',
    'audio',
    'other'
);


--
-- Name: PageLayoutType; Type: TYPE; Schema: files; Owner: -
--

CREATE TYPE files."PageLayoutType" AS ENUM (
    'standard',
    'mixed',
    'full_page',
    'custom'
);


--
-- Name: StorageProvider; Type: TYPE; Schema: files; Owner: -
--

CREATE TYPE files."StorageProvider" AS ENUM (
    'aws_s3',
    'local',
    'minio'
);


--
-- Name: VoucherBookStatus; Type: TYPE; Schema: files; Owner: -
--

CREATE TYPE files."VoucherBookStatus" AS ENUM (
    'draft',
    'ready_for_print',
    'published',
    'archived'
);


--
-- Name: VoucherBookType; Type: TYPE; Schema: files; Owner: -
--

CREATE TYPE files."VoucherBookType" AS ENUM (
    'monthly',
    'special_edition',
    'regional',
    'seasonal',
    'promotional'
);


--
-- Name: DeviceType; Type: TYPE; Schema: identity; Owner: -
--

CREATE TYPE identity."DeviceType" AS ENUM (
    'ios',
    'android',
    'web',
    'desktop'
);


--
-- Name: MfaMethod; Type: TYPE; Schema: identity; Owner: -
--

CREATE TYPE identity."MfaMethod" AS ENUM (
    'sms',
    'totp',
    'email',
    'backup_codes'
);


--
-- Name: UserRole; Type: TYPE; Schema: identity; Owner: -
--

CREATE TYPE identity."UserRole" AS ENUM (
    'admin',
    'customer',
    'business'
);


--
-- Name: UserStatus; Type: TYPE; Schema: identity; Owner: -
--

CREATE TYPE identity."UserStatus" AS ENUM (
    'active',
    'suspended',
    'banned',
    'unconfirmed'
);


--
-- Name: SubscriptionStatus; Type: TYPE; Schema: payments; Owner: -
--

CREATE TYPE payments."SubscriptionStatus" AS ENUM (
    'active',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'past_due',
    'trialing',
    'unpaid'
);


--
-- Name: FraudCaseStatus; Type: TYPE; Schema: security; Owner: -
--

CREATE TYPE security."FraudCaseStatus" AS ENUM (
    'pending',
    'reviewing',
    'approved',
    'rejected',
    'false_positive'
);


--
-- Name: CommunicationMethod; Type: TYPE; Schema: support; Owner: -
--

CREATE TYPE support."CommunicationMethod" AS ENUM (
    'email',
    'sms',
    'push',
    'in_app'
);


--
-- Name: NotificationStatus; Type: TYPE; Schema: support; Owner: -
--

CREATE TYPE support."NotificationStatus" AS ENUM (
    'pending',
    'sent',
    'failed',
    'read'
);


--
-- Name: NotificationType; Type: TYPE; Schema: support; Owner: -
--

CREATE TYPE support."NotificationType" AS ENUM (
    'email',
    'sms',
    'push',
    'in_app'
);


--
-- Name: ProblemPriority; Type: TYPE; Schema: support; Owner: -
--

CREATE TYPE support."ProblemPriority" AS ENUM (
    'low',
    'medium',
    'high',
    'urgent',
    'critical'
);


--
-- Name: ProblemStatus; Type: TYPE; Schema: support; Owner: -
--

CREATE TYPE support."ProblemStatus" AS ENUM (
    'open',
    'assigned',
    'in_progress',
    'waiting_customer',
    'waiting_internal',
    'resolved',
    'closed'
);


--
-- Name: ProblemType; Type: TYPE; Schema: support; Owner: -
--

CREATE TYPE support."ProblemType" AS ENUM (
    'billing',
    'technical',
    'account',
    'general',
    'bug_report',
    'feature_request'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: voucher_scans; Type: TABLE; Schema: analytics; Owner: -
--

CREATE TABLE analytics.voucher_scans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    voucher_id uuid NOT NULL,
    user_id uuid,
    scan_type analytics."VoucherScanType" NOT NULL,
    scan_source analytics."VoucherScanSource" NOT NULL,
    location public.geography(Point,4326),
    device_info jsonb DEFAULT '{}'::jsonb NOT NULL,
    business_id uuid,
    scanned_at timestamp(6) with time zone NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metadata jsonb
);


--
-- Name: audit_logs; Type: TABLE; Schema: audit; Owner: -
--

CREATE TABLE audit.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid NOT NULL,
    action audit."AuditAction" NOT NULL,
    user_id uuid,
    data jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: customer_vouchers; Type: TABLE; Schema: business; Owner: -
--

CREATE TABLE business.customer_vouchers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    voucher_id uuid NOT NULL,
    claimed_at timestamp(6) with time zone NOT NULL,
    status business."CustomerVoucherStatus" DEFAULT 'claimed'::business."CustomerVoucherStatus" NOT NULL,
    notification_preferences jsonb,
    redeemed_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: voucher_codes; Type: TABLE; Schema: business; Owner: -
--

CREATE TABLE business.voucher_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    voucher_id uuid NOT NULL,
    code character varying(500) NOT NULL,
    type business."VoucherCodeType" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: voucher_redemptions; Type: TABLE; Schema: business; Owner: -
--

CREATE TABLE business.voucher_redemptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    voucher_id uuid NOT NULL,
    user_id uuid NOT NULL,
    code_used character varying(500) NOT NULL,
    redeemed_at timestamp(6) with time zone NOT NULL,
    location public.geography(Point,4326),
    metadata jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: vouchers; Type: TABLE; Schema: business; Owner: -
--

CREATE TABLE business.vouchers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    category_id uuid,
    state business."VoucherState" DEFAULT 'draft'::business."VoucherState" NOT NULL,
    title_key character varying(255) NOT NULL,
    description_key character varying(255) NOT NULL,
    terms_and_conditions_key character varying(255) NOT NULL,
    type business."VoucherType" NOT NULL,
    value numeric(10,2),
    discount numeric(5,2),
    currency character varying(3) DEFAULT 'PYG'::character varying NOT NULL,
    location public.geography(Point,4326),
    image_url character varying(500),
    valid_from timestamp(6) with time zone,
    valid_until timestamp(6) with time zone,
    max_redemptions integer,
    max_redemptions_per_user integer DEFAULT 1 NOT NULL,
    redemptions_count integer DEFAULT 0 NOT NULL,
    scan_count integer DEFAULT 0 NOT NULL,
    claim_count integer DEFAULT 0 NOT NULL,
    metadata jsonb,
    qr_code character varying(500),
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp(6) with time zone
);


--
-- Name: categories; Type: TABLE; Schema: catalog; Owner: -
--

CREATE TABLE catalog.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name_key character varying(255) NOT NULL,
    description_key character varying(255),
    icon character varying(255),
    parent_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    slug character varying(255) NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    path character varying(1000) DEFAULT ''::character varying NOT NULL,
    created_by uuid NOT NULL,
    updated_by uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp(6) with time zone
);


--
-- Name: ad_placements; Type: TABLE; Schema: files; Owner: -
--

CREATE TABLE files.ad_placements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    page_id uuid NOT NULL,
    content_type files."ContentType" DEFAULT 'voucher'::files."ContentType" NOT NULL,
    "position" integer NOT NULL,
    size files."AdSize" DEFAULT 'single'::files."AdSize" NOT NULL,
    spaces_used integer DEFAULT 1 NOT NULL,
    image_url character varying(500),
    qr_code_payload text,
    short_code character varying(20),
    title character varying(255),
    description text,
    metadata jsonb,
    created_by uuid NOT NULL,
    updated_by uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: book_distributions; Type: TABLE; Schema: files; Owner: -
--

CREATE TABLE files.book_distributions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    book_id uuid NOT NULL,
    business_id uuid NOT NULL,
    business_name character varying(255) NOT NULL,
    location_id uuid,
    location_name character varying(255),
    quantity integer NOT NULL,
    distribution_type character varying(50) NOT NULL,
    contact_name character varying(255) NOT NULL,
    contact_email character varying(255),
    contact_phone character varying(50),
    delivery_address text,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    shipped_at timestamp(6) with time zone,
    delivered_at timestamp(6) with time zone,
    tracking_number character varying(255),
    shipping_carrier character varying(100),
    notes text,
    metadata jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by uuid NOT NULL,
    updated_by uuid
);


--
-- Name: file_storage_logs; Type: TABLE; Schema: files; Owner: -
--

CREATE TABLE files.file_storage_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    file_id uuid NOT NULL,
    file_name character varying(255) NOT NULL,
    content_type character varying(100) NOT NULL,
    size integer NOT NULL,
    folder character varying(255),
    is_public boolean DEFAULT false NOT NULL,
    url text NOT NULL,
    storage_key text,
    status character varying(20) NOT NULL,
    user_id uuid,
    metadata jsonb,
    provider character varying(50),
    uploaded_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone,
    error_message text,
    processing_time_ms integer,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: voucher_book_pages; Type: TABLE; Schema: files; Owner: -
--

CREATE TABLE files.voucher_book_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    book_id uuid NOT NULL,
    page_number integer NOT NULL,
    layout_type files."PageLayoutType" DEFAULT 'standard'::files."PageLayoutType" NOT NULL,
    metadata jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: voucher_books; Type: TABLE; Schema: files; Owner: -
--

CREATE TABLE files.voucher_books (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    edition character varying(100),
    book_type files."VoucherBookType" DEFAULT 'monthly'::files."VoucherBookType" NOT NULL,
    month integer,
    year integer NOT NULL,
    status files."VoucherBookStatus" DEFAULT 'draft'::files."VoucherBookStatus" NOT NULL,
    total_pages integer DEFAULT 24 NOT NULL,
    published_at timestamp(6) with time zone,
    cover_image_url character varying(500),
    back_image_url character varying(500),
    pdf_url character varying(500),
    pdf_generated_at timestamp(6) with time zone,
    metadata jsonb,
    created_by uuid NOT NULL,
    updated_by uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp(6) with time zone
);


--
-- Name: languages; Type: TABLE; Schema: i18n; Owner: -
--

CREATE TABLE i18n.languages (
    code text NOT NULL,
    name text NOT NULL,
    direction text DEFAULT 'ltr'::text NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: translations; Type: TABLE; Schema: i18n; Owner: -
--

CREATE TABLE i18n.translations (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    "languageCode" text NOT NULL,
    context text,
    service text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: user_language_preferences; Type: TABLE; Schema: i18n; Owner: -
--

CREATE TABLE i18n.user_language_preferences (
    id text NOT NULL,
    "userId" text NOT NULL,
    "languageCode" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: security_events; Type: TABLE; Schema: identity; Owner: -
--

CREATE TABLE identity.security_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    device_id uuid,
    event_type character varying(100) NOT NULL,
    event_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    ip_address inet,
    user_agent text,
    location jsonb,
    risk_score integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_auth_methods; Type: TABLE; Schema: identity; Owner: -
--

CREATE TABLE identity.user_auth_methods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    auth_method character varying(50) NOT NULL,
    provider_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    last_used_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_devices; Type: TABLE; Schema: identity; Owner: -
--

CREATE TABLE identity.user_devices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    device_id character varying(255) NOT NULL,
    device_name character varying(255),
    device_type identity."DeviceType" NOT NULL,
    browser_info jsonb DEFAULT '{}'::jsonb NOT NULL,
    last_ip_address inet,
    last_location jsonb,
    is_trusted boolean DEFAULT false NOT NULL,
    trust_expires_at timestamp(6) with time zone,
    fcm_token character varying(500),
    last_active_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_identities; Type: TABLE; Schema: identity; Owner: -
--

CREATE TABLE identity.user_identities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    provider character varying(50) NOT NULL,
    provider_id character varying(255) NOT NULL,
    firebase_uid character varying(128),
    provider_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    last_sign_in_method character varying(50),
    is_email_verified boolean DEFAULT false NOT NULL,
    is_phone_verified boolean DEFAULT false NOT NULL,
    last_login timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_mfa_settings; Type: TABLE; Schema: identity; Owner: -
--

CREATE TABLE identity.user_mfa_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    is_enabled boolean DEFAULT false NOT NULL,
    preferred_method identity."MfaMethod",
    backup_codes_hash text[],
    backup_codes_generated_at timestamp(6) with time zone,
    backup_codes_used integer DEFAULT 0 NOT NULL,
    totp_secret_encrypted text,
    recovery_email character varying(255),
    phone_number_verified character varying(50),
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: businesses; Type: TABLE; Schema: marketplace; Owner: -
--

CREATE TABLE marketplace.businesses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    business_name_key character varying(255) NOT NULL,
    business_description_key character varying(255),
    category_id uuid NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    active boolean DEFAULT true NOT NULL,
    avg_rating numeric(3,2) DEFAULT 0 NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp(6) with time zone
);


--
-- Name: subscription_plans; Type: TABLE; Schema: payments; Owner: -
--

CREATE TABLE payments.subscription_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    price double precision NOT NULL,
    currency text DEFAULT 'usd'::text NOT NULL,
    "interval" text NOT NULL,
    interval_count integer DEFAULT 1 NOT NULL,
    trial_period_days integer,
    features text[],
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb,
    stripe_product_id text,
    stripe_price_id text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: subscriptions; Type: TABLE; Schema: payments; Owner: -
--

CREATE TABLE payments.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan_id uuid,
    status payments."SubscriptionStatus" DEFAULT 'active'::payments."SubscriptionStatus" NOT NULL,
    current_period_start timestamp(6) with time zone,
    current_period_end timestamp(6) with time zone,
    trial_end timestamp(6) with time zone,
    cancel_at_period_end boolean DEFAULT false NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    stripe_price_id text,
    start_date timestamp(6) with time zone,
    end_date timestamp(6) with time zone,
    cancelled_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: fraud_case_history; Type: TABLE; Schema: security; Owner: -
--

CREATE TABLE security.fraud_case_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    case_id uuid NOT NULL,
    action character varying(100) NOT NULL,
    old_value text,
    new_value text,
    notes text,
    performed_by uuid NOT NULL,
    performed_at timestamp(6) with time zone NOT NULL,
    metadata jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: fraud_cases; Type: TABLE; Schema: security; Owner: -
--

CREATE TABLE security.fraud_cases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    case_number character varying(20) NOT NULL,
    redemption_id uuid NOT NULL,
    detected_at timestamp(6) with time zone NOT NULL,
    risk_score integer NOT NULL,
    flags jsonb NOT NULL,
    detection_metadata jsonb,
    customer_id uuid NOT NULL,
    business_id uuid NOT NULL,
    voucher_id uuid NOT NULL,
    status security."FraudCaseStatus" DEFAULT 'pending'::security."FraudCaseStatus" NOT NULL,
    reviewed_at timestamp(6) with time zone,
    reviewed_by uuid,
    review_notes text,
    actions_taken jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: communication_logs; Type: TABLE; Schema: support; Owner: -
--

CREATE TABLE support.communication_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    type character varying(20) NOT NULL,
    recipient character varying(255) NOT NULL,
    subject character varying(255),
    template_id character varying(100),
    status character varying(20) NOT NULL,
    provider character varying(50),
    provider_id character varying(255),
    metadata jsonb,
    sent_at timestamp(6) with time zone,
    delivered_at timestamp(6) with time zone,
    failed_at timestamp(6) with time zone,
    error_message text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: notifications; Type: TABLE; Schema: support; Owner: -
--

CREATE TABLE support.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    metadata jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    read_at timestamp(6) with time zone
);


--
-- Name: problems; Type: TABLE; Schema: support; Owner: -
--

CREATE TABLE support.problems (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    status support."ProblemStatus" DEFAULT 'open'::support."ProblemStatus" NOT NULL,
    priority support."ProblemPriority" DEFAULT 'medium'::support."ProblemPriority" NOT NULL,
    type support."ProblemType" DEFAULT 'general'::support."ProblemType" NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    resolved_at timestamp(6) with time zone,
    ticket_number character varying(20),
    assigned_to uuid,
    files text[] DEFAULT ARRAY[]::text[]
);


--
-- Name: support_comments; Type: TABLE; Schema: support; Owner: -
--

CREATE TABLE support.support_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    problem_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    is_internal boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: addresses; Type: TABLE; Schema: users; Owner: -
--

CREATE TABLE users.addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    address_line1 character varying(255) NOT NULL,
    address_line2 character varying(255),
    city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    postal_code character varying(20) NOT NULL,
    country character varying(100) DEFAULT 'United States'::character varying NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp(6) with time zone
);


--
-- Name: users; Type: TABLE; Schema: users; Owner: -
--

CREATE TABLE users.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    password text,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    phone_number character varying(50),
    phone_verified boolean DEFAULT false NOT NULL,
    avatar_url character varying(1000),
    role identity."UserRole" DEFAULT 'customer'::identity."UserRole" NOT NULL,
    status identity."UserStatus" DEFAULT 'active'::identity."UserStatus" NOT NULL,
    last_login_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp(6) with time zone,
    date_of_birth date,
    stripe_user_id character varying(255)
);


--
-- Name: voucher_scans voucher_scans_pkey; Type: CONSTRAINT; Schema: analytics; Owner: -
--

ALTER TABLE ONLY analytics.voucher_scans
    ADD CONSTRAINT voucher_scans_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: audit; Owner: -
--

ALTER TABLE ONLY audit.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: customer_vouchers customer_vouchers_pkey; Type: CONSTRAINT; Schema: business; Owner: -
--

ALTER TABLE ONLY business.customer_vouchers
    ADD CONSTRAINT customer_vouchers_pkey PRIMARY KEY (id);


--
-- Name: voucher_codes voucher_codes_pkey; Type: CONSTRAINT; Schema: business; Owner: -
--

ALTER TABLE ONLY business.voucher_codes
    ADD CONSTRAINT voucher_codes_pkey PRIMARY KEY (id);


--
-- Name: voucher_redemptions voucher_redemptions_pkey; Type: CONSTRAINT; Schema: business; Owner: -
--

ALTER TABLE ONLY business.voucher_redemptions
    ADD CONSTRAINT voucher_redemptions_pkey PRIMARY KEY (id);


--
-- Name: vouchers vouchers_pkey; Type: CONSTRAINT; Schema: business; Owner: -
--

ALTER TABLE ONLY business.vouchers
    ADD CONSTRAINT vouchers_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: catalog; Owner: -
--

ALTER TABLE ONLY catalog.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: ad_placements ad_placements_pkey; Type: CONSTRAINT; Schema: files; Owner: -
--

ALTER TABLE ONLY files.ad_placements
    ADD CONSTRAINT ad_placements_pkey PRIMARY KEY (id);


--
-- Name: book_distributions book_distributions_pkey; Type: CONSTRAINT; Schema: files; Owner: -
--

ALTER TABLE ONLY files.book_distributions
    ADD CONSTRAINT book_distributions_pkey PRIMARY KEY (id);


--
-- Name: file_storage_logs file_storage_logs_pkey; Type: CONSTRAINT; Schema: files; Owner: -
--

ALTER TABLE ONLY files.file_storage_logs
    ADD CONSTRAINT file_storage_logs_pkey PRIMARY KEY (id);


--
-- Name: voucher_book_pages voucher_book_pages_pkey; Type: CONSTRAINT; Schema: files; Owner: -
--

ALTER TABLE ONLY files.voucher_book_pages
    ADD CONSTRAINT voucher_book_pages_pkey PRIMARY KEY (id);


--
-- Name: voucher_books voucher_books_pkey; Type: CONSTRAINT; Schema: files; Owner: -
--

ALTER TABLE ONLY files.voucher_books
    ADD CONSTRAINT voucher_books_pkey PRIMARY KEY (id);


--
-- Name: languages languages_pkey; Type: CONSTRAINT; Schema: i18n; Owner: -
--

ALTER TABLE ONLY i18n.languages
    ADD CONSTRAINT languages_pkey PRIMARY KEY (code);


--
-- Name: translations translations_pkey; Type: CONSTRAINT; Schema: i18n; Owner: -
--

ALTER TABLE ONLY i18n.translations
    ADD CONSTRAINT translations_pkey PRIMARY KEY (id);


--
-- Name: user_language_preferences user_language_preferences_pkey; Type: CONSTRAINT; Schema: i18n; Owner: -
--

ALTER TABLE ONLY i18n.user_language_preferences
    ADD CONSTRAINT user_language_preferences_pkey PRIMARY KEY (id);


--
-- Name: security_events security_events_pkey; Type: CONSTRAINT; Schema: identity; Owner: -
--

ALTER TABLE ONLY identity.security_events
    ADD CONSTRAINT security_events_pkey PRIMARY KEY (id);


--
-- Name: user_auth_methods user_auth_methods_pkey; Type: CONSTRAINT; Schema: identity; Owner: -
--

ALTER TABLE ONLY identity.user_auth_methods
    ADD CONSTRAINT user_auth_methods_pkey PRIMARY KEY (id);


--
-- Name: user_devices user_devices_pkey; Type: CONSTRAINT; Schema: identity; Owner: -
--

ALTER TABLE ONLY identity.user_devices
    ADD CONSTRAINT user_devices_pkey PRIMARY KEY (id);


--
-- Name: user_identities user_identities_pkey; Type: CONSTRAINT; Schema: identity; Owner: -
--

ALTER TABLE ONLY identity.user_identities
    ADD CONSTRAINT user_identities_pkey PRIMARY KEY (id);


--
-- Name: user_mfa_settings user_mfa_settings_pkey; Type: CONSTRAINT; Schema: identity; Owner: -
--

ALTER TABLE ONLY identity.user_mfa_settings
    ADD CONSTRAINT user_mfa_settings_pkey PRIMARY KEY (id);


--
-- Name: businesses businesses_pkey; Type: CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.businesses
    ADD CONSTRAINT businesses_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: payments; Owner: -
--

ALTER TABLE ONLY payments.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: payments; Owner: -
--

ALTER TABLE ONLY payments.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: fraud_case_history fraud_case_history_pkey; Type: CONSTRAINT; Schema: security; Owner: -
--

ALTER TABLE ONLY security.fraud_case_history
    ADD CONSTRAINT fraud_case_history_pkey PRIMARY KEY (id);


--
-- Name: fraud_cases fraud_cases_pkey; Type: CONSTRAINT; Schema: security; Owner: -
--

ALTER TABLE ONLY security.fraud_cases
    ADD CONSTRAINT fraud_cases_pkey PRIMARY KEY (id);


--
-- Name: communication_logs communication_logs_pkey; Type: CONSTRAINT; Schema: support; Owner: -
--

ALTER TABLE ONLY support.communication_logs
    ADD CONSTRAINT communication_logs_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: support; Owner: -
--

ALTER TABLE ONLY support.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: problems problems_pkey; Type: CONSTRAINT; Schema: support; Owner: -
--

ALTER TABLE ONLY support.problems
    ADD CONSTRAINT problems_pkey PRIMARY KEY (id);


--
-- Name: support_comments support_comments_pkey; Type: CONSTRAINT; Schema: support; Owner: -
--

ALTER TABLE ONLY support.support_comments
    ADD CONSTRAINT support_comments_pkey PRIMARY KEY (id);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: users; Owner: -
--

ALTER TABLE ONLY users.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: users; Owner: -
--

ALTER TABLE ONLY users.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: voucher_scans_business_id_idx; Type: INDEX; Schema: analytics; Owner: -
--

CREATE INDEX voucher_scans_business_id_idx ON analytics.voucher_scans USING btree (business_id);


--
-- Name: voucher_scans_business_id_scanned_at_idx; Type: INDEX; Schema: analytics; Owner: -
--

CREATE INDEX voucher_scans_business_id_scanned_at_idx ON analytics.voucher_scans USING btree (business_id, scanned_at);


--
-- Name: voucher_scans_scan_source_idx; Type: INDEX; Schema: analytics; Owner: -
--

CREATE INDEX voucher_scans_scan_source_idx ON analytics.voucher_scans USING btree (scan_source);


--
-- Name: voucher_scans_scan_source_scanned_at_idx; Type: INDEX; Schema: analytics; Owner: -
--

CREATE INDEX voucher_scans_scan_source_scanned_at_idx ON analytics.voucher_scans USING btree (scan_source, scanned_at);


--
-- Name: voucher_scans_scan_type_idx; Type: INDEX; Schema: analytics; Owner: -
--

CREATE INDEX voucher_scans_scan_type_idx ON analytics.voucher_scans USING btree (scan_type);


--
-- Name: voucher_scans_scanned_at_idx; Type: INDEX; Schema: analytics; Owner: -
--

CREATE INDEX voucher_scans_scanned_at_idx ON analytics.voucher_scans USING btree (scanned_at);


--
-- Name: voucher_scans_user_id_idx; Type: INDEX; Schema: analytics; Owner: -
--

CREATE INDEX voucher_scans_user_id_idx ON analytics.voucher_scans USING btree (user_id);


--
-- Name: voucher_scans_user_id_scanned_at_idx; Type: INDEX; Schema: analytics; Owner: -
--

CREATE INDEX voucher_scans_user_id_scanned_at_idx ON analytics.voucher_scans USING btree (user_id, scanned_at);


--
-- Name: voucher_scans_voucher_id_idx; Type: INDEX; Schema: analytics; Owner: -
--

CREATE INDEX voucher_scans_voucher_id_idx ON analytics.voucher_scans USING btree (voucher_id);


--
-- Name: voucher_scans_voucher_id_scan_type_idx; Type: INDEX; Schema: analytics; Owner: -
--

CREATE INDEX voucher_scans_voucher_id_scan_type_idx ON analytics.voucher_scans USING btree (voucher_id, scan_type);


--
-- Name: voucher_scans_voucher_id_scanned_at_idx; Type: INDEX; Schema: analytics; Owner: -
--

CREATE INDEX voucher_scans_voucher_id_scanned_at_idx ON analytics.voucher_scans USING btree (voucher_id, scanned_at);


--
-- Name: audit_logs_created_at_idx; Type: INDEX; Schema: audit; Owner: -
--

CREATE INDEX audit_logs_created_at_idx ON audit.audit_logs USING btree (created_at);


--
-- Name: audit_logs_entity_type_entity_id_idx; Type: INDEX; Schema: audit; Owner: -
--

CREATE INDEX audit_logs_entity_type_entity_id_idx ON audit.audit_logs USING btree (entity_type, entity_id);


--
-- Name: audit_logs_user_id_idx; Type: INDEX; Schema: audit; Owner: -
--

CREATE INDEX audit_logs_user_id_idx ON audit.audit_logs USING btree (user_id);


--
-- Name: customer_vouchers_claimed_at_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX customer_vouchers_claimed_at_idx ON business.customer_vouchers USING btree (claimed_at);


--
-- Name: customer_vouchers_customer_id_claimed_at_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX customer_vouchers_customer_id_claimed_at_idx ON business.customer_vouchers USING btree (customer_id, claimed_at);


--
-- Name: customer_vouchers_customer_id_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX customer_vouchers_customer_id_idx ON business.customer_vouchers USING btree (customer_id);


--
-- Name: customer_vouchers_customer_id_status_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX customer_vouchers_customer_id_status_idx ON business.customer_vouchers USING btree (customer_id, status);


--
-- Name: customer_vouchers_customer_id_voucher_id_key; Type: INDEX; Schema: business; Owner: -
--

CREATE UNIQUE INDEX customer_vouchers_customer_id_voucher_id_key ON business.customer_vouchers USING btree (customer_id, voucher_id);


--
-- Name: customer_vouchers_redeemed_at_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX customer_vouchers_redeemed_at_idx ON business.customer_vouchers USING btree (redeemed_at);


--
-- Name: customer_vouchers_status_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX customer_vouchers_status_idx ON business.customer_vouchers USING btree (status);


--
-- Name: customer_vouchers_voucher_id_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX customer_vouchers_voucher_id_idx ON business.customer_vouchers USING btree (voucher_id);


--
-- Name: customer_vouchers_voucher_id_status_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX customer_vouchers_voucher_id_status_idx ON business.customer_vouchers USING btree (voucher_id, status);


--
-- Name: voucher_codes_code_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX voucher_codes_code_idx ON business.voucher_codes USING btree (code);


--
-- Name: voucher_codes_code_key; Type: INDEX; Schema: business; Owner: -
--

CREATE UNIQUE INDEX voucher_codes_code_key ON business.voucher_codes USING btree (code);


--
-- Name: voucher_codes_is_active_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX voucher_codes_is_active_idx ON business.voucher_codes USING btree (is_active);


--
-- Name: voucher_codes_type_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX voucher_codes_type_idx ON business.voucher_codes USING btree (type);


--
-- Name: voucher_codes_voucher_id_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX voucher_codes_voucher_id_idx ON business.voucher_codes USING btree (voucher_id);


--
-- Name: voucher_codes_voucher_id_is_active_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX voucher_codes_voucher_id_is_active_idx ON business.voucher_codes USING btree (voucher_id, is_active);


--
-- Name: voucher_codes_voucher_id_type_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX voucher_codes_voucher_id_type_idx ON business.voucher_codes USING btree (voucher_id, type);


--
-- Name: voucher_redemptions_code_used_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX voucher_redemptions_code_used_idx ON business.voucher_redemptions USING btree (code_used);


--
-- Name: voucher_redemptions_redeemed_at_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX voucher_redemptions_redeemed_at_idx ON business.voucher_redemptions USING btree (redeemed_at);


--
-- Name: voucher_redemptions_user_id_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX voucher_redemptions_user_id_idx ON business.voucher_redemptions USING btree (user_id);


--
-- Name: voucher_redemptions_user_id_redeemed_at_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX voucher_redemptions_user_id_redeemed_at_idx ON business.voucher_redemptions USING btree (user_id, redeemed_at);


--
-- Name: voucher_redemptions_voucher_id_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX voucher_redemptions_voucher_id_idx ON business.voucher_redemptions USING btree (voucher_id);


--
-- Name: voucher_redemptions_voucher_id_redeemed_at_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX voucher_redemptions_voucher_id_redeemed_at_idx ON business.voucher_redemptions USING btree (voucher_id, redeemed_at);


--
-- Name: voucher_redemptions_voucher_id_user_id_key; Type: INDEX; Schema: business; Owner: -
--

CREATE UNIQUE INDEX voucher_redemptions_voucher_id_user_id_key ON business.voucher_redemptions USING btree (voucher_id, user_id);


--
-- Name: vouchers_business_id_created_at_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX vouchers_business_id_created_at_idx ON business.vouchers USING btree (business_id, created_at);


--
-- Name: vouchers_business_id_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX vouchers_business_id_idx ON business.vouchers USING btree (business_id);


--
-- Name: vouchers_category_id_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX vouchers_category_id_idx ON business.vouchers USING btree (category_id);


--
-- Name: vouchers_category_id_state_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX vouchers_category_id_state_idx ON business.vouchers USING btree (category_id, state);


--
-- Name: vouchers_created_at_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX vouchers_created_at_idx ON business.vouchers USING btree (created_at);


--
-- Name: vouchers_deleted_at_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX vouchers_deleted_at_idx ON business.vouchers USING btree (deleted_at);


--
-- Name: vouchers_qr_code_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX vouchers_qr_code_idx ON business.vouchers USING btree (qr_code);


--
-- Name: vouchers_qr_code_key; Type: INDEX; Schema: business; Owner: -
--

CREATE UNIQUE INDEX vouchers_qr_code_key ON business.vouchers USING btree (qr_code);


--
-- Name: vouchers_state_business_id_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX vouchers_state_business_id_idx ON business.vouchers USING btree (state, business_id);


--
-- Name: vouchers_state_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX vouchers_state_idx ON business.vouchers USING btree (state);


--
-- Name: vouchers_state_valid_until_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX vouchers_state_valid_until_idx ON business.vouchers USING btree (state, valid_until);


--
-- Name: vouchers_type_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX vouchers_type_idx ON business.vouchers USING btree (type);


--
-- Name: vouchers_updated_at_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX vouchers_updated_at_idx ON business.vouchers USING btree (updated_at);


--
-- Name: vouchers_valid_from_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX vouchers_valid_from_idx ON business.vouchers USING btree (valid_from);


--
-- Name: vouchers_valid_until_idx; Type: INDEX; Schema: business; Owner: -
--

CREATE INDEX vouchers_valid_until_idx ON business.vouchers USING btree (valid_until);


--
-- Name: categories_is_active_deleted_at_idx; Type: INDEX; Schema: catalog; Owner: -
--

CREATE INDEX categories_is_active_deleted_at_idx ON catalog.categories USING btree (is_active, deleted_at);


--
-- Name: categories_level_idx; Type: INDEX; Schema: catalog; Owner: -
--

CREATE INDEX categories_level_idx ON catalog.categories USING btree (level);


--
-- Name: categories_level_sort_order_idx; Type: INDEX; Schema: catalog; Owner: -
--

CREATE INDEX categories_level_sort_order_idx ON catalog.categories USING btree (level, sort_order);


--
-- Name: categories_name_key_idx; Type: INDEX; Schema: catalog; Owner: -
--

CREATE INDEX categories_name_key_idx ON catalog.categories USING btree (name_key);


--
-- Name: categories_parent_id_idx; Type: INDEX; Schema: catalog; Owner: -
--

CREATE INDEX categories_parent_id_idx ON catalog.categories USING btree (parent_id);


--
-- Name: categories_parent_id_is_active_deleted_at_idx; Type: INDEX; Schema: catalog; Owner: -
--

CREATE INDEX categories_parent_id_is_active_deleted_at_idx ON catalog.categories USING btree (parent_id, is_active, deleted_at);


--
-- Name: categories_path_idx; Type: INDEX; Schema: catalog; Owner: -
--

CREATE INDEX categories_path_idx ON catalog.categories USING btree (path);


--
-- Name: categories_slug_idx; Type: INDEX; Schema: catalog; Owner: -
--

CREATE INDEX categories_slug_idx ON catalog.categories USING btree (slug);


--
-- Name: categories_slug_key; Type: INDEX; Schema: catalog; Owner: -
--

CREATE UNIQUE INDEX categories_slug_key ON catalog.categories USING btree (slug);


--
-- Name: categories_sort_order_idx; Type: INDEX; Schema: catalog; Owner: -
--

CREATE INDEX categories_sort_order_idx ON catalog.categories USING btree (sort_order);


--
-- Name: ad_placements_content_type_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX ad_placements_content_type_idx ON files.ad_placements USING btree (content_type);


--
-- Name: ad_placements_created_by_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX ad_placements_created_by_idx ON files.ad_placements USING btree (created_by);


--
-- Name: ad_placements_page_id_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX ad_placements_page_id_idx ON files.ad_placements USING btree (page_id);


--
-- Name: ad_placements_page_id_position_key; Type: INDEX; Schema: files; Owner: -
--

CREATE UNIQUE INDEX ad_placements_page_id_position_key ON files.ad_placements USING btree (page_id, "position");


--
-- Name: ad_placements_updated_by_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX ad_placements_updated_by_idx ON files.ad_placements USING btree (updated_by);


--
-- Name: book_distributions_book_id_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX book_distributions_book_id_idx ON files.book_distributions USING btree (book_id);


--
-- Name: book_distributions_business_id_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX book_distributions_business_id_idx ON files.book_distributions USING btree (business_id);


--
-- Name: book_distributions_created_at_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX book_distributions_created_at_idx ON files.book_distributions USING btree (created_at);


--
-- Name: book_distributions_delivered_at_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX book_distributions_delivered_at_idx ON files.book_distributions USING btree (delivered_at);


--
-- Name: book_distributions_location_id_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX book_distributions_location_id_idx ON files.book_distributions USING btree (location_id);


--
-- Name: book_distributions_shipped_at_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX book_distributions_shipped_at_idx ON files.book_distributions USING btree (shipped_at);


--
-- Name: book_distributions_status_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX book_distributions_status_idx ON files.book_distributions USING btree (status);


--
-- Name: file_storage_logs_content_type_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX file_storage_logs_content_type_idx ON files.file_storage_logs USING btree (content_type);


--
-- Name: file_storage_logs_created_at_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX file_storage_logs_created_at_idx ON files.file_storage_logs USING btree (created_at);


--
-- Name: file_storage_logs_file_id_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX file_storage_logs_file_id_idx ON files.file_storage_logs USING btree (file_id);


--
-- Name: file_storage_logs_folder_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX file_storage_logs_folder_idx ON files.file_storage_logs USING btree (folder);


--
-- Name: file_storage_logs_is_public_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX file_storage_logs_is_public_idx ON files.file_storage_logs USING btree (is_public);


--
-- Name: file_storage_logs_status_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX file_storage_logs_status_idx ON files.file_storage_logs USING btree (status);


--
-- Name: file_storage_logs_user_id_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX file_storage_logs_user_id_idx ON files.file_storage_logs USING btree (user_id);


--
-- Name: voucher_book_pages_book_id_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX voucher_book_pages_book_id_idx ON files.voucher_book_pages USING btree (book_id);


--
-- Name: voucher_book_pages_book_id_page_number_key; Type: INDEX; Schema: files; Owner: -
--

CREATE UNIQUE INDEX voucher_book_pages_book_id_page_number_key ON files.voucher_book_pages USING btree (book_id, page_number);


--
-- Name: voucher_books_book_type_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX voucher_books_book_type_idx ON files.voucher_books USING btree (book_type);


--
-- Name: voucher_books_book_type_status_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX voucher_books_book_type_status_idx ON files.voucher_books USING btree (book_type, status);


--
-- Name: voucher_books_created_at_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX voucher_books_created_at_idx ON files.voucher_books USING btree (created_at);


--
-- Name: voucher_books_created_by_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX voucher_books_created_by_idx ON files.voucher_books USING btree (created_by);


--
-- Name: voucher_books_deleted_at_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX voucher_books_deleted_at_idx ON files.voucher_books USING btree (deleted_at);


--
-- Name: voucher_books_edition_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX voucher_books_edition_idx ON files.voucher_books USING btree (edition);


--
-- Name: voucher_books_pdf_generated_at_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX voucher_books_pdf_generated_at_idx ON files.voucher_books USING btree (pdf_generated_at);


--
-- Name: voucher_books_published_at_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX voucher_books_published_at_idx ON files.voucher_books USING btree (published_at);


--
-- Name: voucher_books_status_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX voucher_books_status_idx ON files.voucher_books USING btree (status);


--
-- Name: voucher_books_status_year_month_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX voucher_books_status_year_month_idx ON files.voucher_books USING btree (status, year, month);


--
-- Name: voucher_books_updated_by_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX voucher_books_updated_by_idx ON files.voucher_books USING btree (updated_by);


--
-- Name: voucher_books_year_month_idx; Type: INDEX; Schema: files; Owner: -
--

CREATE INDEX voucher_books_year_month_idx ON files.voucher_books USING btree (year, month);


--
-- Name: translations_key_languageCode_idx; Type: INDEX; Schema: i18n; Owner: -
--

CREATE INDEX "translations_key_languageCode_idx" ON i18n.translations USING btree (key, "languageCode");


--
-- Name: translations_key_languageCode_key; Type: INDEX; Schema: i18n; Owner: -
--

CREATE UNIQUE INDEX "translations_key_languageCode_key" ON i18n.translations USING btree (key, "languageCode");


--
-- Name: translations_service_key_idx; Type: INDEX; Schema: i18n; Owner: -
--

CREATE INDEX translations_service_key_idx ON i18n.translations USING btree (service, key);


--
-- Name: user_language_preferences_userId_idx; Type: INDEX; Schema: i18n; Owner: -
--

CREATE INDEX "user_language_preferences_userId_idx" ON i18n.user_language_preferences USING btree ("userId");


--
-- Name: user_language_preferences_userId_key; Type: INDEX; Schema: i18n; Owner: -
--

CREATE UNIQUE INDEX "user_language_preferences_userId_key" ON i18n.user_language_preferences USING btree ("userId");


--
-- Name: security_events_created_at_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX security_events_created_at_idx ON identity.security_events USING btree (created_at);


--
-- Name: security_events_event_type_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX security_events_event_type_idx ON identity.security_events USING btree (event_type);


--
-- Name: security_events_risk_score_created_at_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX security_events_risk_score_created_at_idx ON identity.security_events USING btree (risk_score, created_at);


--
-- Name: security_events_user_id_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX security_events_user_id_idx ON identity.security_events USING btree (user_id);


--
-- Name: user_auth_methods_auth_method_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX user_auth_methods_auth_method_idx ON identity.user_auth_methods USING btree (auth_method);


--
-- Name: user_auth_methods_user_id_auth_method_key; Type: INDEX; Schema: identity; Owner: -
--

CREATE UNIQUE INDEX user_auth_methods_user_id_auth_method_key ON identity.user_auth_methods USING btree (user_id, auth_method);


--
-- Name: user_auth_methods_user_id_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX user_auth_methods_user_id_idx ON identity.user_auth_methods USING btree (user_id);


--
-- Name: user_auth_methods_user_id_is_enabled_last_used_at_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX user_auth_methods_user_id_is_enabled_last_used_at_idx ON identity.user_auth_methods USING btree (user_id, is_enabled, last_used_at);


--
-- Name: user_devices_fcm_token_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX user_devices_fcm_token_idx ON identity.user_devices USING btree (fcm_token);


--
-- Name: user_devices_user_id_device_id_key; Type: INDEX; Schema: identity; Owner: -
--

CREATE UNIQUE INDEX user_devices_user_id_device_id_key ON identity.user_devices USING btree (user_id, device_id);


--
-- Name: user_devices_user_id_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX user_devices_user_id_idx ON identity.user_devices USING btree (user_id);


--
-- Name: user_devices_user_id_is_trusted_trust_expires_at_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX user_devices_user_id_is_trusted_trust_expires_at_idx ON identity.user_devices USING btree (user_id, is_trusted, trust_expires_at);


--
-- Name: user_devices_user_id_last_active_at_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX user_devices_user_id_last_active_at_idx ON identity.user_devices USING btree (user_id, last_active_at);


--
-- Name: user_identities_firebase_uid_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX user_identities_firebase_uid_idx ON identity.user_identities USING btree (firebase_uid);


--
-- Name: user_identities_firebase_uid_key; Type: INDEX; Schema: identity; Owner: -
--

CREATE UNIQUE INDEX user_identities_firebase_uid_key ON identity.user_identities USING btree (firebase_uid);


--
-- Name: user_identities_provider_provider_id_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX user_identities_provider_provider_id_idx ON identity.user_identities USING btree (provider, provider_id);


--
-- Name: user_identities_provider_provider_id_key; Type: INDEX; Schema: identity; Owner: -
--

CREATE UNIQUE INDEX user_identities_provider_provider_id_key ON identity.user_identities USING btree (provider, provider_id);


--
-- Name: user_identities_user_id_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX user_identities_user_id_idx ON identity.user_identities USING btree (user_id);


--
-- Name: user_identities_user_id_key; Type: INDEX; Schema: identity; Owner: -
--

CREATE UNIQUE INDEX user_identities_user_id_key ON identity.user_identities USING btree (user_id);


--
-- Name: user_mfa_settings_user_id_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX user_mfa_settings_user_id_idx ON identity.user_mfa_settings USING btree (user_id);


--
-- Name: user_mfa_settings_user_id_is_enabled_idx; Type: INDEX; Schema: identity; Owner: -
--

CREATE INDEX user_mfa_settings_user_id_is_enabled_idx ON identity.user_mfa_settings USING btree (user_id, is_enabled);


--
-- Name: user_mfa_settings_user_id_key; Type: INDEX; Schema: identity; Owner: -
--

CREATE UNIQUE INDEX user_mfa_settings_user_id_key ON identity.user_mfa_settings USING btree (user_id);


--
-- Name: businesses_avg_rating_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX businesses_avg_rating_idx ON marketplace.businesses USING btree (avg_rating);


--
-- Name: businesses_category_id_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX businesses_category_id_idx ON marketplace.businesses USING btree (category_id);


--
-- Name: businesses_deleted_at_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX businesses_deleted_at_idx ON marketplace.businesses USING btree (deleted_at);


--
-- Name: businesses_user_id_key; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE UNIQUE INDEX businesses_user_id_key ON marketplace.businesses USING btree (user_id);


--
-- Name: businesses_verified_active_idx; Type: INDEX; Schema: marketplace; Owner: -
--

CREATE INDEX businesses_verified_active_idx ON marketplace.businesses USING btree (verified, active);


--
-- Name: subscription_plans_interval_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX subscription_plans_interval_idx ON payments.subscription_plans USING btree ("interval");


--
-- Name: subscription_plans_is_active_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX subscription_plans_is_active_idx ON payments.subscription_plans USING btree (is_active);


--
-- Name: subscription_plans_name_key; Type: INDEX; Schema: payments; Owner: -
--

CREATE UNIQUE INDEX subscription_plans_name_key ON payments.subscription_plans USING btree (name);


--
-- Name: subscription_plans_stripe_price_id_key; Type: INDEX; Schema: payments; Owner: -
--

CREATE UNIQUE INDEX subscription_plans_stripe_price_id_key ON payments.subscription_plans USING btree (stripe_price_id);


--
-- Name: subscription_plans_stripe_product_id_key; Type: INDEX; Schema: payments; Owner: -
--

CREATE UNIQUE INDEX subscription_plans_stripe_product_id_key ON payments.subscription_plans USING btree (stripe_product_id);


--
-- Name: subscriptions_plan_id_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX subscriptions_plan_id_idx ON payments.subscriptions USING btree (plan_id);


--
-- Name: subscriptions_status_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX subscriptions_status_idx ON payments.subscriptions USING btree (status);


--
-- Name: subscriptions_stripe_subscription_id_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX subscriptions_stripe_subscription_id_idx ON payments.subscriptions USING btree (stripe_subscription_id);


--
-- Name: subscriptions_stripe_subscription_id_key; Type: INDEX; Schema: payments; Owner: -
--

CREATE UNIQUE INDEX subscriptions_stripe_subscription_id_key ON payments.subscriptions USING btree (stripe_subscription_id);


--
-- Name: subscriptions_user_id_idx; Type: INDEX; Schema: payments; Owner: -
--

CREATE INDEX subscriptions_user_id_idx ON payments.subscriptions USING btree (user_id);


--
-- Name: fraud_case_history_action_idx; Type: INDEX; Schema: security; Owner: -
--

CREATE INDEX fraud_case_history_action_idx ON security.fraud_case_history USING btree (action);


--
-- Name: fraud_case_history_case_id_idx; Type: INDEX; Schema: security; Owner: -
--

CREATE INDEX fraud_case_history_case_id_idx ON security.fraud_case_history USING btree (case_id);


--
-- Name: fraud_case_history_case_id_performed_at_idx; Type: INDEX; Schema: security; Owner: -
--

CREATE INDEX fraud_case_history_case_id_performed_at_idx ON security.fraud_case_history USING btree (case_id, performed_at);


--
-- Name: fraud_case_history_performed_at_idx; Type: INDEX; Schema: security; Owner: -
--

CREATE INDEX fraud_case_history_performed_at_idx ON security.fraud_case_history USING btree (performed_at);


--
-- Name: fraud_case_history_performed_by_idx; Type: INDEX; Schema: security; Owner: -
--

CREATE INDEX fraud_case_history_performed_by_idx ON security.fraud_case_history USING btree (performed_by);


--
-- Name: fraud_cases_business_id_idx; Type: INDEX; Schema: security; Owner: -
--

CREATE INDEX fraud_cases_business_id_idx ON security.fraud_cases USING btree (business_id);


--
-- Name: fraud_cases_business_id_status_idx; Type: INDEX; Schema: security; Owner: -
--

CREATE INDEX fraud_cases_business_id_status_idx ON security.fraud_cases USING btree (business_id, status);


--
-- Name: fraud_cases_case_number_idx; Type: INDEX; Schema: security; Owner: -
--

CREATE INDEX fraud_cases_case_number_idx ON security.fraud_cases USING btree (case_number);


--
-- Name: fraud_cases_case_number_key; Type: INDEX; Schema: security; Owner: -
--

CREATE UNIQUE INDEX fraud_cases_case_number_key ON security.fraud_cases USING btree (case_number);


--
-- Name: fraud_cases_customer_id_idx; Type: INDEX; Schema: security; Owner: -
--

CREATE INDEX fraud_cases_customer_id_idx ON security.fraud_cases USING btree (customer_id);


--
-- Name: fraud_cases_customer_id_status_idx; Type: INDEX; Schema: security; Owner: -
--

CREATE INDEX fraud_cases_customer_id_status_idx ON security.fraud_cases USING btree (customer_id, status);


--
-- Name: fraud_cases_detected_at_idx; Type: INDEX; Schema: security; Owner: -
--

CREATE INDEX fraud_cases_detected_at_idx ON security.fraud_cases USING btree (detected_at);


--
-- Name: fraud_cases_redemption_id_key; Type: INDEX; Schema: security; Owner: -
--

CREATE UNIQUE INDEX fraud_cases_redemption_id_key ON security.fraud_cases USING btree (redemption_id);


--
-- Name: fraud_cases_reviewed_by_idx; Type: INDEX; Schema: security; Owner: -
--

CREATE INDEX fraud_cases_reviewed_by_idx ON security.fraud_cases USING btree (reviewed_by);


--
-- Name: fraud_cases_risk_score_idx; Type: INDEX; Schema: security; Owner: -
--

CREATE INDEX fraud_cases_risk_score_idx ON security.fraud_cases USING btree (risk_score);


--
-- Name: fraud_cases_risk_score_status_idx; Type: INDEX; Schema: security; Owner: -
--

CREATE INDEX fraud_cases_risk_score_status_idx ON security.fraud_cases USING btree (risk_score, status);


--
-- Name: fraud_cases_status_detected_at_idx; Type: INDEX; Schema: security; Owner: -
--

CREATE INDEX fraud_cases_status_detected_at_idx ON security.fraud_cases USING btree (status, detected_at);


--
-- Name: fraud_cases_status_idx; Type: INDEX; Schema: security; Owner: -
--

CREATE INDEX fraud_cases_status_idx ON security.fraud_cases USING btree (status);


--
-- Name: fraud_cases_voucher_id_idx; Type: INDEX; Schema: security; Owner: -
--

CREATE INDEX fraud_cases_voucher_id_idx ON security.fraud_cases USING btree (voucher_id);


--
-- Name: communication_logs_created_at_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX communication_logs_created_at_idx ON support.communication_logs USING btree (created_at);


--
-- Name: communication_logs_recipient_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX communication_logs_recipient_idx ON support.communication_logs USING btree (recipient);


--
-- Name: communication_logs_template_id_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX communication_logs_template_id_idx ON support.communication_logs USING btree (template_id);


--
-- Name: communication_logs_type_status_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX communication_logs_type_status_idx ON support.communication_logs USING btree (type, status);


--
-- Name: communication_logs_user_id_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX communication_logs_user_id_idx ON support.communication_logs USING btree (user_id);


--
-- Name: notifications_type_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX notifications_type_idx ON support.notifications USING btree (type);


--
-- Name: notifications_user_id_created_at_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX notifications_user_id_created_at_idx ON support.notifications USING btree (user_id, created_at);


--
-- Name: notifications_user_id_is_read_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX notifications_user_id_is_read_idx ON support.notifications USING btree (user_id, is_read);


--
-- Name: problems_assigned_to_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX problems_assigned_to_idx ON support.problems USING btree (assigned_to);


--
-- Name: problems_created_at_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX problems_created_at_idx ON support.problems USING btree (created_at);


--
-- Name: problems_priority_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX problems_priority_idx ON support.problems USING btree (priority);


--
-- Name: problems_status_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX problems_status_idx ON support.problems USING btree (status);


--
-- Name: problems_ticket_number_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX problems_ticket_number_idx ON support.problems USING btree (ticket_number);


--
-- Name: problems_ticket_number_key; Type: INDEX; Schema: support; Owner: -
--

CREATE UNIQUE INDEX problems_ticket_number_key ON support.problems USING btree (ticket_number);


--
-- Name: problems_type_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX problems_type_idx ON support.problems USING btree (type);


--
-- Name: problems_user_id_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX problems_user_id_idx ON support.problems USING btree (user_id);


--
-- Name: support_comments_created_at_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX support_comments_created_at_idx ON support.support_comments USING btree (created_at);


--
-- Name: support_comments_problem_id_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX support_comments_problem_id_idx ON support.support_comments USING btree (problem_id);


--
-- Name: support_comments_user_id_idx; Type: INDEX; Schema: support; Owner: -
--

CREATE INDEX support_comments_user_id_idx ON support.support_comments USING btree (user_id);


--
-- Name: addresses_user_id_idx; Type: INDEX; Schema: users; Owner: -
--

CREATE INDEX addresses_user_id_idx ON users.addresses USING btree (user_id);


--
-- Name: users_deleted_at_idx; Type: INDEX; Schema: users; Owner: -
--

CREATE INDEX users_deleted_at_idx ON users.users USING btree (deleted_at);


--
-- Name: users_email_idx; Type: INDEX; Schema: users; Owner: -
--

CREATE INDEX users_email_idx ON users.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: users; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON users.users USING btree (email);


--
-- Name: users_phone_number_idx; Type: INDEX; Schema: users; Owner: -
--

CREATE INDEX users_phone_number_idx ON users.users USING btree (phone_number);


--
-- Name: voucher_scans voucher_scans_business_id_fkey; Type: FK CONSTRAINT; Schema: analytics; Owner: -
--

ALTER TABLE ONLY analytics.voucher_scans
    ADD CONSTRAINT voucher_scans_business_id_fkey FOREIGN KEY (business_id) REFERENCES marketplace.businesses(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: voucher_scans voucher_scans_user_id_fkey; Type: FK CONSTRAINT; Schema: analytics; Owner: -
--

ALTER TABLE ONLY analytics.voucher_scans
    ADD CONSTRAINT voucher_scans_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: voucher_scans voucher_scans_voucher_id_fkey; Type: FK CONSTRAINT; Schema: analytics; Owner: -
--

ALTER TABLE ONLY analytics.voucher_scans
    ADD CONSTRAINT voucher_scans_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES business.vouchers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customer_vouchers customer_vouchers_customer_id_fkey; Type: FK CONSTRAINT; Schema: business; Owner: -
--

ALTER TABLE ONLY business.customer_vouchers
    ADD CONSTRAINT customer_vouchers_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customer_vouchers customer_vouchers_voucher_id_fkey; Type: FK CONSTRAINT; Schema: business; Owner: -
--

ALTER TABLE ONLY business.customer_vouchers
    ADD CONSTRAINT customer_vouchers_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES business.vouchers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: voucher_codes voucher_codes_voucher_id_fkey; Type: FK CONSTRAINT; Schema: business; Owner: -
--

ALTER TABLE ONLY business.voucher_codes
    ADD CONSTRAINT voucher_codes_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES business.vouchers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: voucher_redemptions voucher_redemptions_user_id_fkey; Type: FK CONSTRAINT; Schema: business; Owner: -
--

ALTER TABLE ONLY business.voucher_redemptions
    ADD CONSTRAINT voucher_redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: voucher_redemptions voucher_redemptions_voucher_id_fkey; Type: FK CONSTRAINT; Schema: business; Owner: -
--

ALTER TABLE ONLY business.voucher_redemptions
    ADD CONSTRAINT voucher_redemptions_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES business.vouchers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vouchers vouchers_business_id_fkey; Type: FK CONSTRAINT; Schema: business; Owner: -
--

ALTER TABLE ONLY business.vouchers
    ADD CONSTRAINT vouchers_business_id_fkey FOREIGN KEY (business_id) REFERENCES marketplace.businesses(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: vouchers vouchers_category_id_fkey; Type: FK CONSTRAINT; Schema: business; Owner: -
--

ALTER TABLE ONLY business.vouchers
    ADD CONSTRAINT vouchers_category_id_fkey FOREIGN KEY (category_id) REFERENCES catalog.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: catalog; Owner: -
--

ALTER TABLE ONLY catalog.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES catalog.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ad_placements ad_placements_created_by_fkey; Type: FK CONSTRAINT; Schema: files; Owner: -
--

ALTER TABLE ONLY files.ad_placements
    ADD CONSTRAINT ad_placements_created_by_fkey FOREIGN KEY (created_by) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ad_placements ad_placements_page_id_fkey; Type: FK CONSTRAINT; Schema: files; Owner: -
--

ALTER TABLE ONLY files.ad_placements
    ADD CONSTRAINT ad_placements_page_id_fkey FOREIGN KEY (page_id) REFERENCES files.voucher_book_pages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ad_placements ad_placements_updated_by_fkey; Type: FK CONSTRAINT; Schema: files; Owner: -
--

ALTER TABLE ONLY files.ad_placements
    ADD CONSTRAINT ad_placements_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: book_distributions book_distributions_book_id_fkey; Type: FK CONSTRAINT; Schema: files; Owner: -
--

ALTER TABLE ONLY files.book_distributions
    ADD CONSTRAINT book_distributions_book_id_fkey FOREIGN KEY (book_id) REFERENCES files.voucher_books(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: book_distributions book_distributions_created_by_fkey; Type: FK CONSTRAINT; Schema: files; Owner: -
--

ALTER TABLE ONLY files.book_distributions
    ADD CONSTRAINT book_distributions_created_by_fkey FOREIGN KEY (created_by) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: book_distributions book_distributions_updated_by_fkey; Type: FK CONSTRAINT; Schema: files; Owner: -
--

ALTER TABLE ONLY files.book_distributions
    ADD CONSTRAINT book_distributions_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: file_storage_logs file_storage_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: files; Owner: -
--

ALTER TABLE ONLY files.file_storage_logs
    ADD CONSTRAINT file_storage_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: voucher_book_pages voucher_book_pages_book_id_fkey; Type: FK CONSTRAINT; Schema: files; Owner: -
--

ALTER TABLE ONLY files.voucher_book_pages
    ADD CONSTRAINT voucher_book_pages_book_id_fkey FOREIGN KEY (book_id) REFERENCES files.voucher_books(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: voucher_books voucher_books_created_by_fkey; Type: FK CONSTRAINT; Schema: files; Owner: -
--

ALTER TABLE ONLY files.voucher_books
    ADD CONSTRAINT voucher_books_created_by_fkey FOREIGN KEY (created_by) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: voucher_books voucher_books_updated_by_fkey; Type: FK CONSTRAINT; Schema: files; Owner: -
--

ALTER TABLE ONLY files.voucher_books
    ADD CONSTRAINT voucher_books_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: translations translations_languageCode_fkey; Type: FK CONSTRAINT; Schema: i18n; Owner: -
--

ALTER TABLE ONLY i18n.translations
    ADD CONSTRAINT "translations_languageCode_fkey" FOREIGN KEY ("languageCode") REFERENCES i18n.languages(code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_language_preferences user_language_preferences_languageCode_fkey; Type: FK CONSTRAINT; Schema: i18n; Owner: -
--

ALTER TABLE ONLY i18n.user_language_preferences
    ADD CONSTRAINT "user_language_preferences_languageCode_fkey" FOREIGN KEY ("languageCode") REFERENCES i18n.languages(code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: security_events security_events_device_id_fkey; Type: FK CONSTRAINT; Schema: identity; Owner: -
--

ALTER TABLE ONLY identity.security_events
    ADD CONSTRAINT security_events_device_id_fkey FOREIGN KEY (device_id) REFERENCES identity.user_devices(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: security_events security_events_user_id_fkey; Type: FK CONSTRAINT; Schema: identity; Owner: -
--

ALTER TABLE ONLY identity.security_events
    ADD CONSTRAINT security_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_auth_methods user_auth_methods_user_id_fkey; Type: FK CONSTRAINT; Schema: identity; Owner: -
--

ALTER TABLE ONLY identity.user_auth_methods
    ADD CONSTRAINT user_auth_methods_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_devices user_devices_user_id_fkey; Type: FK CONSTRAINT; Schema: identity; Owner: -
--

ALTER TABLE ONLY identity.user_devices
    ADD CONSTRAINT user_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_identities user_identities_user_id_fkey; Type: FK CONSTRAINT; Schema: identity; Owner: -
--

ALTER TABLE ONLY identity.user_identities
    ADD CONSTRAINT user_identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_mfa_settings user_mfa_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: identity; Owner: -
--

ALTER TABLE ONLY identity.user_mfa_settings
    ADD CONSTRAINT user_mfa_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: businesses businesses_category_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.businesses
    ADD CONSTRAINT businesses_category_id_fkey FOREIGN KEY (category_id) REFERENCES catalog.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: businesses businesses_user_id_fkey; Type: FK CONSTRAINT; Schema: marketplace; Owner: -
--

ALTER TABLE ONLY marketplace.businesses
    ADD CONSTRAINT businesses_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: subscriptions subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: payments; Owner: -
--

ALTER TABLE ONLY payments.subscriptions
    ADD CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES payments.subscription_plans(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: payments; Owner: -
--

ALTER TABLE ONLY payments.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fraud_case_history fraud_case_history_case_id_fkey; Type: FK CONSTRAINT; Schema: security; Owner: -
--

ALTER TABLE ONLY security.fraud_case_history
    ADD CONSTRAINT fraud_case_history_case_id_fkey FOREIGN KEY (case_id) REFERENCES security.fraud_cases(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fraud_case_history fraud_case_history_performed_by_fkey; Type: FK CONSTRAINT; Schema: security; Owner: -
--

ALTER TABLE ONLY security.fraud_case_history
    ADD CONSTRAINT fraud_case_history_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fraud_cases fraud_cases_business_id_fkey; Type: FK CONSTRAINT; Schema: security; Owner: -
--

ALTER TABLE ONLY security.fraud_cases
    ADD CONSTRAINT fraud_cases_business_id_fkey FOREIGN KEY (business_id) REFERENCES marketplace.businesses(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fraud_cases fraud_cases_customer_id_fkey; Type: FK CONSTRAINT; Schema: security; Owner: -
--

ALTER TABLE ONLY security.fraud_cases
    ADD CONSTRAINT fraud_cases_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fraud_cases fraud_cases_redemption_id_fkey; Type: FK CONSTRAINT; Schema: security; Owner: -
--

ALTER TABLE ONLY security.fraud_cases
    ADD CONSTRAINT fraud_cases_redemption_id_fkey FOREIGN KEY (redemption_id) REFERENCES business.voucher_redemptions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fraud_cases fraud_cases_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: security; Owner: -
--

ALTER TABLE ONLY security.fraud_cases
    ADD CONSTRAINT fraud_cases_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: fraud_cases fraud_cases_voucher_id_fkey; Type: FK CONSTRAINT; Schema: security; Owner: -
--

ALTER TABLE ONLY security.fraud_cases
    ADD CONSTRAINT fraud_cases_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES business.vouchers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: communication_logs communication_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: support; Owner: -
--

ALTER TABLE ONLY support.communication_logs
    ADD CONSTRAINT communication_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: support; Owner: -
--

ALTER TABLE ONLY support.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: problems problems_assigned_to_fkey; Type: FK CONSTRAINT; Schema: support; Owner: -
--

ALTER TABLE ONLY support.problems
    ADD CONSTRAINT problems_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: problems problems_user_id_fkey; Type: FK CONSTRAINT; Schema: support; Owner: -
--

ALTER TABLE ONLY support.problems
    ADD CONSTRAINT problems_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: support_comments support_comments_problem_id_fkey; Type: FK CONSTRAINT; Schema: support; Owner: -
--

ALTER TABLE ONLY support.support_comments
    ADD CONSTRAINT support_comments_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES support.problems(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: support_comments support_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: support; Owner: -
--

ALTER TABLE ONLY support.support_comments
    ADD CONSTRAINT support_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: addresses addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: users; Owner: -
--

ALTER TABLE ONLY users.addresses
    ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

