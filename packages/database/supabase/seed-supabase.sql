-- Pika Database Seed Script for Supabase
-- This script creates minimal test data with proper relationships
-- Run this in Supabase SQL Editor

-- Note: Passwords: Admin123!, Member123!, Trainer123!, Therapist123!, Creator123!
-- Generated with bcrypt rounds=10

BEGIN;

-- Clear existing data (in reverse order of dependencies)
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
DELETE FROM gyms.gyms;
DELETE FROM users.addresses;
DELETE FROM users.friends;
DELETE FROM social.follows;
DELETE FROM social.social_interactions;
DELETE FROM social.activities;
DELETE FROM users.users;

-- Step 1: Create Users with proper UUIDs
-- Passwords: Admin123!, Member123!, Trainer123!, Therapist123!, Creator123! (bcrypt hash with salt rounds 10)
INSERT INTO users.users (email, email_verified, password, first_name, last_name, phone_number, role, status, created_at, updated_at) VALUES
-- Admin
('admin@pika.com', true, '$2b$10$AC8Bne3C27.Xr8eXveOm5eXKVTTX56sUcVLEfPL8zV4zq3npYjasO', 'Admin', 'User', '+44 20 1234 5678', 'ADMIN', 'ACTIVE', NOW(), NOW()),
-- Members
('member1@pika.com', true, '$2b$10$SqUoDTeY3385sge58hemte6Gq/MeWRW3yCf6fYDYmXkSk5A7R5gWS', 'John', 'Doe', '+44 161 234 5678', 'MEMBER', 'ACTIVE', NOW(), NOW()),
('member2@pika.com', true, '$2b$10$8rS02ylbztH2YKW1Kqs5buHfM6kcqs2TcVhhIIQh7Dg7xIQeenC7W', 'Jane', 'Smith', '+44 121 234 5678', 'MEMBER', 'ACTIVE', NOW(), NOW()),
('member3@pika.com', true, '$2b$10$9OUu3nOSR6NLG2nVhgNlduhMLyFF7Pl0QVYl8QSh3M2RzyFmQ4Hmi', 'Bob', 'Johnson', '+44 113 234 5678', 'MEMBER', 'ACTIVE', NOW(), NOW()),
-- Professionals/Trainers
('trainer1@pika.com', true, '$2b$10$DKGUyRGyz7Id2LLmbKy/XeKCrl4d8ZFM0IXxA4B8gwowDf1T7ZjEG', 'Mike', 'Wilson', '+44 161 345 6789', 'PROFESSIONAL', 'ACTIVE', NOW(), NOW()),
('trainer2@pika.com', true, '$2b$10$TWBrilzZG0BNJ.U0EojAHeTzEL/X0N86C8M141fIUe/j8DyZsWE.6', 'Sarah', 'Davis', '+44 121 345 6789', 'PROFESSIONAL', 'ACTIVE', NOW(), NOW()),
-- Therapist
('therapist@pika.com', true, '$2b$10$62exc7AV2j2V/XFKa/VVWOp1o0WW2g6lxVCc.NUipjJvzN.UFtH1.', 'Emma', 'Brown', '+44 113 345 6789', 'THERAPIST', 'ACTIVE', NOW(), NOW()),
-- Content Creator
('creator@pika.com', true, '$2b$10$uyr3S5D4Hm9az7Sg92iMb.YfzNnvENtYP3sn3/6cEPdkhTUct4I76', 'Alex', 'Taylor', '+44 20 345 6789', 'CONTENT_CREATOR', 'ACTIVE', NOW(), NOW());

-- Get user IDs for foreign key references
-- Admin user
CREATE TEMPORARY TABLE temp_users AS 
SELECT id, email FROM users.users WHERE email IN (
  'admin@pika.com', 'member1@pika.com', 'member2@pika.com', 'member3@pika.com',
  'trainer1@pika.com', 'trainer2@pika.com', 'therapist@pika.com', 'creator@pika.com'
);

-- Step 2: Create User Addresses using actual user IDs
INSERT INTO users.addresses (user_id, address_line1, city, state, postal_code, country, is_default, created_at, updated_at) 
SELECT 
  u.id,
  CASE 
    WHEN u.email = 'admin@pika.com' THEN '123 Admin St'
    WHEN u.email = 'member1@pika.com' THEN '456 Member Ave'
    WHEN u.email = 'trainer1@pika.com' THEN '789 Trainer Rd'
  END as address_line1,
  CASE 
    WHEN u.email = 'admin@pika.com' THEN 'London'
    WHEN u.email = 'member1@pika.com' THEN 'Manchester'
    WHEN u.email = 'trainer1@pika.com' THEN 'Birmingham'
  END as city,
  'England' as state,
  CASE 
    WHEN u.email = 'admin@pika.com' THEN 'SW1A 1AA'
    WHEN u.email = 'member1@pika.com' THEN 'M1 1AE'
    WHEN u.email = 'trainer1@pika.com' THEN 'B1 1AA'
  END as postal_code,
  'UK' as country,
  true as is_default,
  NOW() as created_at,
  NOW() as updated_at
FROM temp_users u 
WHERE u.email IN ('admin@pika.com', 'member1@pika.com', 'trainer1@pika.com');

-- Step 3: Create Gyms
INSERT INTO gyms.gyms (name, description, address, opening_hours, area, capacity, price_range, city, state, country, postal_code, phone_number, email, status, is_active, is_partner, tier, verification_status, created_at, updated_at) VALUES
('FitLife Gym Central', 'Premium fitness center in the heart of London', '1 Fitness St, London SW1A 2AA', 'Mon-Fri: 7:00-22:00, Sat-Sun: 8:00-20:00', 2000, 150, '$$', 'London', 'England', 'UK', 'SW1A 2AA', '+44 20 1234 5678', 'info@fitlifegym.com', 'ACTIVE', true, false, 'PREMIUM', 'APPROVED', NOW(), NOW()),
('PowerHouse Fitness', 'State-of-the-art training facility', '50 Power Lane, Manchester M1 2JQ', 'Mon-Fri: 6:00-23:00, Sat-Sun: 7:00-21:00', 3000, 200, '$$$', 'Manchester', 'England', 'UK', 'M1 2JQ', '+44 161 234 5678', 'contact@powerhousefitness.com', 'ACTIVE', true, false, 'STANDARD', 'APPROVED', NOW(), NOW()),
('Urban Fitness Studio', 'Boutique fitness studio', '25 Urban Way, Birmingham B2 4QA', 'Mon-Fri: 7:00-21:00, Sat-Sun: 8:00-18:00', 1500, 80, '$$', 'Birmingham', 'England', 'UK', 'B2 4QA', '+44 121 234 5678', 'hello@urbanfitness.com', 'ACTIVE', true, false, 'BASIC', 'APPROVED', NOW(), NOW());

-- Get gym IDs for foreign key references
CREATE TEMPORARY TABLE temp_gyms AS 
SELECT id, name FROM gyms.gyms WHERE name IN ('FitLife Gym Central', 'PowerHouse Fitness', 'Urban Fitness Studio');

-- Step 4: Create Gym Equipment/Amenities/Features using actual gym IDs
INSERT INTO gyms.stuff (gym_id, name, icon, type, is_active, created_at, updated_at)
SELECT 
  g.id,
  equipment.name,
  equipment.icon,
  equipment.type::gyms."StuffType",
  true,
  NOW(),
  NOW()
FROM temp_gyms g
CROSS JOIN (
  VALUES 
    ('Treadmill', 'treadmill', 'EQUIPMENT'),
    ('Dumbbells (5-100 lbs)', 'dumbbell', 'EQUIPMENT'),
    ('Cable Machine', 'cable', 'EQUIPMENT'),
    ('Locker Rooms', 'locker', 'AMENITY'),
    ('Showers', 'shower', 'AMENITY'),
    ('Personal Training', 'trainer', 'FEATURE')
) AS equipment(name, icon, type)
WHERE g.name = 'FitLife Gym Central'

UNION ALL

SELECT 
  g.id,
  equipment.name,
  equipment.icon,
  equipment.type::gyms."StuffType",
  true,
  NOW(),
  NOW()
FROM temp_gyms g
CROSS JOIN (
  VALUES 
    ('Smith Machine', 'smith', 'EQUIPMENT'),
    ('Rowing Machine', 'rowing', 'EQUIPMENT'),
    ('Sauna', 'sauna', 'AMENITY'),
    ('Parking', 'parking', 'AMENITY')
) AS equipment(name, icon, type)
WHERE g.name = 'PowerHouse Fitness';

-- Step 5: Create Gym Hourly Prices using actual gym IDs
INSERT INTO gyms.gym_hourly_prices (gym_id, day_of_week, hour, price, created_at)
SELECT 
  g.id,
  day_price.day_of_week::gyms."WeekDay",
  day_price.hour,
  day_price.price,
  NOW()
FROM temp_gyms g
CROSS JOIN (
  VALUES 
    ('MONDAY', 10, 20),
    ('TUESDAY', 10, 20),
    ('WEDNESDAY', 10, 20),
    ('THURSDAY', 10, 20),
    ('FRIDAY', 10, 25),
    ('SATURDAY', 10, 30),
    ('SUNDAY', 10, 30)
) AS day_price(day_of_week, hour, price)
WHERE g.name = 'FitLife Gym Central'

UNION ALL

SELECT 
  g.id,
  day_price.day_of_week::gyms."WeekDay",
  day_price.hour,
  day_price.price,
  NOW()
FROM temp_gyms g
CROSS JOIN (
  VALUES 
    ('MONDAY', 10, 25),
    ('TUESDAY', 10, 25)
) AS day_price(day_of_week, hour, price)
WHERE g.name = 'PowerHouse Fitness';

-- Step 6: Create Gym Members using actual user and gym IDs
INSERT INTO gyms.gym_members (gym_id, user_id, status, joined_at)
SELECT 
  g.id,
  u.id,
  'ACTIVE',
  NOW()
FROM temp_gyms g, temp_users u
WHERE (g.name = 'FitLife Gym Central' AND u.email IN ('member1@pika.com', 'member2@pika.com'))
   OR (g.name = 'PowerHouse Fitness' AND u.email = 'member3@pika.com');

-- Step 7: Create Gym Trainers using actual user and gym IDs
INSERT INTO gyms.gym_trainers (gym_id, user_id, status, start_date)
SELECT 
  g.id,
  u.id,
  'ACTIVE',
  CURRENT_DATE
FROM temp_gyms g, temp_users u
WHERE (g.name = 'FitLife Gym Central' AND u.email = 'trainer1@pika.com')
   OR (g.name = 'PowerHouse Fitness' AND u.email = 'trainer2@pika.com')
   OR (g.name = 'Urban Fitness Studio' AND u.email = 'therapist@pika.com');

-- Step 8: Create Friends Relationships using actual user IDs
INSERT INTO users.friends (user_id, email, name, status, type, referred_user_id, invited_at, created_at, updated_at)
SELECT 
  member.id,
  trainer.email,
  CONCAT(trainer_users.first_name, ' ', trainer_users.last_name),
  'ACCEPTED'::users."FriendStatus",
  'CLIENT'::users."FriendOrClientType",
  trainer.id,
  NOW(),
  NOW(),
  NOW()
FROM temp_users member, temp_users trainer, users.users trainer_users
WHERE member.email = 'member1@pika.com' AND trainer.email = 'trainer1@pika.com' AND trainer_users.id = trainer.id

UNION ALL

SELECT 
  member.id,
  trainer.email,
  CONCAT(trainer_users.first_name, ' ', trainer_users.last_name),
  'ACCEPTED'::users."FriendStatus",
  'CLIENT'::users."FriendOrClientType",
  trainer.id,
  NOW(),
  NOW(),
  NOW()
FROM temp_users member, temp_users trainer, users.users trainer_users
WHERE member.email = 'member2@pika.com' AND trainer.email = 'trainer2@pika.com' AND trainer_users.id = trainer.id;

-- Step 9: Create Sessions using actual user and gym IDs
INSERT INTO sessions.sessions (user_id, gym_id, date, start_time, end_time, duration, status, price, purpose, trainer_id, trainer_name, gym_name, created_at, updated_at)
SELECT 
  member.id,
  gym.id,
  (CURRENT_DATE + INTERVAL '2 days')::date,
  '10:00:00'::time,
  '11:00:00'::time,
  60,
  'UPCOMING'::sessions."SessionStatus",
  30,
  'WORKOUT'::sessions."SessionPurpose",
  trainer.id,
  CONCAT(trainer_users.first_name, ' ', trainer_users.last_name),
  gym.name,
  NOW(),
  NOW()
FROM temp_users member, temp_gyms gym, temp_users trainer, users.users trainer_users
WHERE member.email = 'member1@pika.com' 
  AND gym.name = 'FitLife Gym Central' 
  AND trainer.email = 'trainer1@pika.com'
  AND trainer_users.id = trainer.id

UNION ALL

SELECT 
  member.id,
  gym.id,
  (CURRENT_DATE + INTERVAL '3 days')::date,
  '14:00:00'::time,
  '15:30:00'::time,
  90,
  'UPCOMING'::sessions."SessionStatus",
  45,
  'WORKOUT'::sessions."SessionPurpose",
  trainer.id,
  CONCAT(trainer_users.first_name, ' ', trainer_users.last_name),
  gym.name,
  NOW(),
  NOW()
FROM temp_users member, temp_gyms gym, temp_users trainer, users.users trainer_users
WHERE member.email = 'member2@pika.com' 
  AND gym.name = 'PowerHouse Fitness' 
  AND trainer.email = 'trainer2@pika.com'
  AND trainer_users.id = trainer.id

UNION ALL

SELECT 
  member.id,
  gym.id,
  (CURRENT_DATE - INTERVAL '5 days')::date,
  '09:00:00'::time,
  '10:00:00'::time,
  60,
  'COMPLETED'::sessions."SessionStatus",
  30,
  'WORKOUT'::sessions."SessionPurpose",
  trainer.id,
  CONCAT(trainer_users.first_name, ' ', trainer_users.last_name),
  gym.name,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
FROM temp_users member, temp_gyms gym, temp_users trainer, users.users trainer_users
WHERE member.email = 'member1@pika.com' 
  AND gym.name = 'FitLife Gym Central' 
  AND trainer.email = 'trainer1@pika.com'
  AND trainer_users.id = trainer.id

UNION ALL

SELECT 
  member.id,
  gym.id,
  (CURRENT_DATE - INTERVAL '3 days')::date,
  '16:00:00'::time,
  '17:00:00'::time,
  60,
  'COMPLETED'::sessions."SessionStatus",
  25,
  'WORKING'::sessions."SessionPurpose",
  therapist.id,
  CONCAT(therapist_users.first_name, ' ', therapist_users.last_name),
  gym.name,
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
FROM temp_users member, temp_gyms gym, temp_users therapist, users.users therapist_users
WHERE member.email = 'member3@pika.com' 
  AND gym.name = 'Urban Fitness Studio' 
  AND therapist.email = 'therapist@pika.com'
  AND therapist_users.id = therapist.id

UNION ALL

SELECT 
  creator.id,
  gym.id,
  (CURRENT_DATE + INTERVAL '7 days')::date,
  '18:00:00'::time,
  '19:30:00'::time,
  90,
  'UPCOMING'::sessions."SessionStatus",
  50,
  'CONTENT'::sessions."SessionPurpose",
  NULL,
  NULL,
  gym.name,
  NOW(),
  NOW()
FROM temp_users creator, temp_gyms gym
WHERE creator.email = 'creator@pika.com' 
  AND gym.name = 'FitLife Gym Central';

-- Step 10: Create Session Reviews for completed sessions
INSERT INTO sessions.session_reviews (session_id, user_id, rating, reason, created_at, updated_at)
SELECT 
  s.id,
  s.user_id,
  'HAPPY'::sessions."SessionRating",
  CASE 
    WHEN s.trainer_name LIKE '%Mike%' THEN 'Great workout session! Mike is an excellent trainer.'
    WHEN s.trainer_name LIKE '%Emma%' THEN 'Very productive session with Emma. Highly recommended!'
  END,
  s.created_at + INTERVAL '1 day',
  s.created_at + INTERVAL '1 day'
FROM sessions.sessions s
WHERE s.status = 'COMPLETED';

-- Step 11: Create Gym Reviews
INSERT INTO gyms.gym_reviews (gym_id, user_id, rating, comment, created_at)
SELECT 
  gym.id,
  member.id,
  CASE 
    WHEN gym.name = 'FitLife Gym Central' THEN 5
    WHEN gym.name = 'PowerHouse Fitness' THEN 4
  END,
  CASE 
    WHEN gym.name = 'FitLife Gym Central' THEN 'Excellent facilities and great staff!'
    WHEN gym.name = 'PowerHouse Fitness' THEN 'Good equipment, can get crowded during peak hours.'
  END,
  NOW() - INTERVAL '10 days'
FROM temp_gyms gym, temp_users member
WHERE (gym.name = 'FitLife Gym Central' AND member.email = 'member1@pika.com')
   OR (gym.name = 'PowerHouse Fitness' AND member.email = 'member2@pika.com');

-- Step 12: Create Activities
INSERT INTO social.activities (user_id, type, entity_type, entity_id, metadata, privacy, created_at)
SELECT 
  s.user_id,
  CASE 
    WHEN s.status = 'UPCOMING' THEN 'SESSION_BOOKED'::social."ActivityType"
    WHEN s.status = 'COMPLETED' THEN 'SESSION_COMPLETED'::social."ActivityType"
  END,
  'session',
  s.id,
  JSON_BUILD_OBJECT('gymName', s.gym_name),
  'PUBLIC'::social."PrivacyLevel",
  s.created_at
FROM sessions.sessions s
WHERE s.status IN ('UPCOMING', 'COMPLETED')
LIMIT 2;

-- Step 13: Create Follows
INSERT INTO social.follows (follower_id, following_id, created_at)
SELECT 
  member.id,
  trainer.id,
  NOW() - INTERVAL '20 days'
FROM temp_users member, temp_users trainer
WHERE member.email = 'member1@pika.com' AND trainer.email = 'trainer1@pika.com'

UNION ALL

SELECT 
  member.id,
  trainer.id,
  NOW() - INTERVAL '15 days'
FROM temp_users member, temp_users trainer
WHERE member.email = 'member2@pika.com' AND trainer.email = 'trainer2@pika.com';

-- Clean up temporary tables
DROP TABLE temp_users;
DROP TABLE temp_gyms;

COMMIT;

-- Summary of created data:
-- - 8 Users (1 Admin, 3 Members, 2 Trainers, 1 Therapist, 1 Content Creator)
-- - 3 Gyms with equipment and amenities
-- - 5 Sessions (2 upcoming, 2 completed, 1 future)
-- - 2 Session reviews
-- - 2 Gym reviews
-- - Friend relationships
-- - Activities and social connections

-- Test Credentials:
-- Admin: admin@pika.com / Admin123!
-- Member 1: member1@pika.com / Member123!
-- Member 2: member2@pika.com / Member123!
-- Member 3: member3@pika.com / Member123!
-- Trainer 1: trainer1@pika.com / Trainer123!
-- Trainer 2: trainer2@pika.com / Trainer123!
-- Therapist: therapist@pika.com / Therapist123!
-- Creator: creator@pika.com / Creator123!