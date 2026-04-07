ALTER TABLE "user" ADD COLUMN "refresh_token_hash" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "refresh_token_expires_at" timestamp with time zone;