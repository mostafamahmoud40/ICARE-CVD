CREATE TABLE IF NOT EXISTS "medication_adherence_flag" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL REFERENCES "patient"("id") ON DELETE CASCADE,
  "medication_id" uuid REFERENCES "medication"("id") ON DELETE SET NULL,
  "reason" text NOT NULL,
  "severity" varchar(20) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'open',
  "resolution_note" text,
  "created_by_user_id" integer REFERENCES "user"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "resolved_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "medication_escalation" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL REFERENCES "patient"("id") ON DELETE CASCADE,
  "medication_id" uuid REFERENCES "medication"("id") ON DELETE SET NULL,
  "priority" varchar(20) NOT NULL,
  "reason" text NOT NULL,
  "note" text NOT NULL DEFAULT '',
  "status" varchar(30) NOT NULL DEFAULT 'waiting_review',
  "created_by_user_id" integer REFERENCES "user"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "medication_contact_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL REFERENCES "patient"("id") ON DELETE CASCADE,
  "channel" varchar(20) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'queued',
  "summary" text NOT NULL,
  "message_preview" text NOT NULL DEFAULT '',
  "created_by_user_id" integer REFERENCES "user"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "medication_ai_insight_dismissal" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL REFERENCES "patient"("id") ON DELETE CASCADE,
  "insight_key" varchar(120) NOT NULL,
  "dismissed_by_user_id" integer REFERENCES "user"("id") ON DELETE SET NULL,
  "dismissed_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "medication_ai_insight_dismissal_unique"
  ON "medication_ai_insight_dismissal" ("patient_id", "insight_key");
