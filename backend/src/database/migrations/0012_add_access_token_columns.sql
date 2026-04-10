-- Add access_token_hash and access_token_expires_at columns to user table
ALTER TABLE "user"
ADD COLUMN access_token_hash text,
ADD COLUMN access_token_expires_at timestamp with time zone;
