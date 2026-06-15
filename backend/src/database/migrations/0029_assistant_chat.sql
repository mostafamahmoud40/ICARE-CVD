-- Assistant chat: extend conversations for assistant↔doctor and assistant↔patient threads

ALTER TYPE "sender_type_enum" ADD VALUE IF NOT EXISTS 'assistant';

DO $$
BEGIN
  CREATE TYPE "conversation_type_enum" AS ENUM (
    'doctor_patient',
    'assistant_doctor',
    'assistant_patient'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "conversations"
  ADD COLUMN IF NOT EXISTS "conversation_type" "conversation_type_enum" NOT NULL DEFAULT 'doctor_patient',
  ADD COLUMN IF NOT EXISTS "assistant_id" uuid REFERENCES "assistant"("id") ON DELETE CASCADE;

ALTER TABLE "conversations"
  ALTER COLUMN "doctor_id" DROP NOT NULL,
  ALTER COLUMN "patient_id" DROP NOT NULL;

DROP INDEX IF EXISTS "conversations_doctor_patient_unique";

CREATE UNIQUE INDEX IF NOT EXISTS "conversations_doctor_patient_unique"
  ON "conversations" ("doctor_id", "patient_id")
  WHERE "conversation_type" = 'doctor_patient';

CREATE UNIQUE INDEX IF NOT EXISTS "conversations_assistant_doctor_unique"
  ON "conversations" ("assistant_id", "doctor_id")
  WHERE "conversation_type" = 'assistant_doctor';

CREATE UNIQUE INDEX IF NOT EXISTS "conversations_assistant_patient_unique"
  ON "conversations" ("assistant_id", "patient_id")
  WHERE "conversation_type" = 'assistant_patient';

CREATE INDEX IF NOT EXISTS "conversations_assistant_idx"
  ON "conversations" ("assistant_id");
