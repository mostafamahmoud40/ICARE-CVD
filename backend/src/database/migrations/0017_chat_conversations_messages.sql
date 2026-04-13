-- Migration: Create chat conversations and messages tables

DO $$
BEGIN
  CREATE TYPE "sender_type_enum" AS ENUM ('doctor', 'patient');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "conversations" (
  "id" serial PRIMARY KEY,
  "doctor_id" uuid NOT NULL REFERENCES "doctor"("id") ON DELETE CASCADE,
  "patient_id" uuid NOT NULL REFERENCES "patient"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "conversations_doctor_patient_unique"
  ON "conversations" ("doctor_id", "patient_id");

CREATE INDEX IF NOT EXISTS "conversations_doctor_idx"
  ON "conversations" ("doctor_id");

CREATE INDEX IF NOT EXISTS "conversations_patient_idx"
  ON "conversations" ("patient_id");

CREATE TABLE IF NOT EXISTS "messages" (
  "id" serial PRIMARY KEY,
  "conversation_id" int NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "sender_id" int NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "sender_type" "sender_type_enum" NOT NULL,
  "message" text NOT NULL,
  "is_read" boolean NOT NULL DEFAULT false,
  "sent_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "messages_conversation_sent_at_idx"
  ON "messages" ("conversation_id", "sent_at");
