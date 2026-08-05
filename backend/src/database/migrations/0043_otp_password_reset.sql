-- Migration: Add OTP password-reset columns to user table
ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "otp_code" text,
  ADD COLUMN IF NOT EXISTS "otp_expires_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "otp_reset_token" text,
  ADD COLUMN IF NOT EXISTS "otp_reset_token_expires_at" timestamptz;
