CREATE TABLE IF NOT EXISTS "doctor_assistant" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "doctor_id" uuid NOT NULL REFERENCES "doctor"("id") ON DELETE CASCADE,
  "assistant_id" uuid NOT NULL REFERENCES "assistant"("id") ON DELETE CASCADE,
  "linked_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "doctor_assistant_unique" ON "doctor_assistant" ("doctor_id", "assistant_id");
