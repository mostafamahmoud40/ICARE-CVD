-- Fix: enum vs varchar comparisons fail for some clients (JDBC, IntelliJ, etc.)
-- Store role as text with a check constraint instead of PostgreSQL enum.

ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "user" ALTER COLUMN "role" TYPE text USING "role"::text;

ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'patient';

ALTER TABLE "user" ADD CONSTRAINT "user_role_check" CHECK (
  "role" IN ('admin', 'patient', 'assistant', 'doctor')
);

DROP TYPE IF EXISTS "public"."user_role";
