DO $$ BEGIN
  CREATE TYPE "public"."procedure_order_status" AS ENUM('pending', 'in-progress', 'completed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."procedure_priority" AS ENUM('normal', 'urgent', 'emergency');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."procedure_requirement_kind" AS ENUM('standard', 'consent');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "procedure_order" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL REFERENCES "patient"("id") ON DELETE cascade,
  "doctor_id" uuid NOT NULL REFERENCES "doctor"("id") ON DELETE cascade,
  "consultation_id" uuid REFERENCES "consultation"("id") ON DELETE set null,
  "procedure_name" text NOT NULL,
  "department" varchar(120) DEFAULT 'Cardiology' NOT NULL,
  "scheduled_at" timestamp with time zone,
  "scheduled_end_at" timestamp with time zone,
  "actual_end_at" timestamp with time zone,
  "status" "procedure_order_status" DEFAULT 'pending' NOT NULL,
  "priority" "procedure_priority" DEFAULT 'normal' NOT NULL,
  "location" varchar(120),
  "team_status" varchar(120),
  "duration_minutes" integer,
  "risk_score" varchar(120),
  "risk_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "procedure_requirement" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL REFERENCES "procedure_order"("id") ON DELETE cascade,
  "title" text NOT NULL,
  "description" text,
  "kind" "procedure_requirement_kind" DEFAULT 'standard' NOT NULL,
  "allows_attachment" boolean DEFAULT false NOT NULL,
  "due_at" timestamp with time zone,
  "is_done" boolean DEFAULT false NOT NULL,
  "completed_at" timestamp with time zone,
  "attachment_key" text,
  "attachment_name" varchar(255),
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "procedure_consent" (
  "order_id" uuid PRIMARY KEY REFERENCES "procedure_order"("id") ON DELETE cascade,
  "requirement_id" uuid NOT NULL REFERENCES "procedure_requirement"("id") ON DELETE cascade,
  "signer_type" varchar(20) NOT NULL,
  "signer_name" varchar(200) NOT NULL,
  "guardian_relationship" varchar(120),
  "collection_method" varchar(20) NOT NULL,
  "signature_data_url" text,
  "attachment_key" text,
  "attachment_name" varchar(255),
  "signed_at" timestamp with time zone NOT NULL
);

CREATE INDEX IF NOT EXISTS "procedure_order_patient_id_idx" ON "procedure_order" ("patient_id");
CREATE INDEX IF NOT EXISTS "procedure_order_doctor_id_idx" ON "procedure_order" ("doctor_id");
CREATE INDEX IF NOT EXISTS "procedure_order_scheduled_at_idx" ON "procedure_order" ("scheduled_at");
CREATE INDEX IF NOT EXISTS "procedure_order_status_idx" ON "procedure_order" ("status");
CREATE INDEX IF NOT EXISTS "procedure_requirement_order_id_idx" ON "procedure_requirement" ("order_id");
