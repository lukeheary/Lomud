-- Add is_onboarding column to users table
-- Defaults to true for new users, set to false when onboarding is complete
ALTER TABLE "users" ADD COLUMN "is_onboarding" boolean NOT NULL DEFAULT true;

-- Set existing users who have completed onboarding (have a real username) to false
UPDATE "users" SET "is_onboarding" = false WHERE "username" NOT LIKE 'user_%';
