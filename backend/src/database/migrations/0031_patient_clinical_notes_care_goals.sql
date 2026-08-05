CREATE TYPE "public"."care_goal_status" AS ENUM('on-track', 'off-track', 'achieved');

CREATE TABLE IF NOT EXISTS "patient_clinical_note" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL REFERENCES "public"."patient"("id") ON DELETE cascade,
  "author_user_id" integer REFERENCES "public"."user"("id") ON DELETE set null,
  "body" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "patient_care_goal" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL REFERENCES "public"."patient"("id") ON DELETE cascade,
  "created_by_user_id" integer REFERENCES "public"."user"("id") ON DELETE set null,
  "metric" varchar(120) NOT NULL,
  "target" varchar(120) NOT NULL,
  "current_value" varchar(120),
  "status" "care_goal_status" DEFAULT 'on-track' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "patient_clinical_note_patient_id_idx"
  ON "patient_clinical_note" ("patient_id");

CREATE INDEX IF NOT EXISTS "patient_care_goal_patient_id_idx"
  ON "patient_care_goal" ("patient_id");
