-- Clean Slate Script for Vercel/Supabase Database
-- WARNING: This will delete ALL data from the database
-- Use with extreme caution!

BEGIN;

-- Clear all data in dependency order (most dependent to least dependent)
DELETE FROM sessions.session_reviews;
DELETE FROM sessions.session_invitees;
DELETE FROM sessions.session_records;
DELETE FROM sessions.waiting_list;
DELETE FROM sessions.invitations;
DELETE FROM sessions.sessions;

DELETE FROM gyms.gym_reviews;
DELETE FROM gyms.gym_trainers;
DELETE FROM gyms.gym_members;
DELETE FROM gyms.gym_special_prices;
DELETE FROM gyms.gym_hourly_prices;
DELETE FROM gyms.stuff;
DELETE FROM gyms.inductions;
DELETE FROM gyms.gyms;

DELETE FROM users.addresses;
DELETE FROM users.friends;
DELETE FROM users.professionals;
DELETE FROM users.parq;

DELETE FROM social.follows;
DELETE FROM social.social_interactions;
DELETE FROM social.activities;

DELETE FROM payments.promo_code_usages;
DELETE FROM payments.promo_codes;
DELETE FROM payments.credits_history;
DELETE FROM payments.credits;
DELETE FROM payments.credits_packs;
DELETE FROM payments.memberships;
DELETE FROM payments.subscriptions;
DELETE FROM payments.subscription_plans;

DELETE FROM support.support_comments;
DELETE FROM support.problems;
DELETE FROM support.communication_logs;
DELETE FROM support.notifications;
DELETE FROM support.templates;

DELETE FROM identity.security_events;
DELETE FROM identity.user_mfa_settings;
DELETE FROM identity.user_devices;
DELETE FROM identity.user_auth_methods;
DELETE FROM identity.user_identities;

DELETE FROM files.file_storage_logs;

DELETE FROM audit.audit_logs;

-- Finally delete users (this should be last due to foreign key constraints)
DELETE FROM users.users;

COMMIT;

-- Summary: All tables have been cleared
-- The database is now in a clean state
-- You can now run the seed script to populate with fresh data