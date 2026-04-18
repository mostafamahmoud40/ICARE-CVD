-- Ensure UUID generator exists (gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
CREATE TYPE "public"."lab_order_priority" AS ENUM('routine', 'urgent', 'stat');--> statement-breakpoint
CREATE TYPE "public"."lab_order_status" AS ENUM('draft', 'ordered', 'collected', 'resulted', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."lab_result_status" AS ENUM('normal', 'high', 'low', 'critical');--> statement-breakpoint

-- Lab order header
CREATE TABLE "lab_order" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL REFERENCES "patient"("id") ON DELETE CASCADE,
  "ordered_by_doctor_id" uuid REFERENCES "doctor"("id") ON DELETE SET NULL,
  "appointment_id" uuid REFERENCES "appointment"("id") ON DELETE SET NULL,
  "priority" "public"."lab_order_priority" DEFAULT 'routine' NOT NULL,
  "status" "public"."lab_order_status" DEFAULT 'ordered' NOT NULL,
  "notes" text,
  "external_ref" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "cancelled_at" timestamptz,
  "cancelled_by_user_id" integer REFERENCES "user"("id") ON DELETE SET NULL
);

CREATE INDEX "idx_lab_order_patient_created_at" ON "lab_order" ("patient_id", "created_at" DESC);
CREATE INDEX "idx_lab_order_doctor_created_at" ON "lab_order" ("ordered_by_doctor_id", "created_at" DESC);

-- Lab order items (tests)
CREATE TABLE "lab_order_item" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "lab_order_id" uuid NOT NULL REFERENCES "lab_order"("id") ON DELETE CASCADE,
  "test_name" varchar(200) NOT NULL,
  "loinc_code" varchar(30),
  "panel" varchar(120),
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX "idx_lab_order_item_order" ON "lab_order_item" ("lab_order_id");

-- Lab results
CREATE TABLE "lab_result" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL REFERENCES "patient"("id") ON DELETE CASCADE,
  "lab_order_item_id" uuid REFERENCES "lab_order_item"("id") ON DELETE SET NULL,
  "document_id" uuid REFERENCES "patient_document"("id") ON DELETE SET NULL,
  "test_name" varchar(200) NOT NULL,
  "value" varchar(100) NOT NULL,
  "unit" varchar(50),
  "reference_range" varchar(120),
  "status" "public"."lab_result_status" DEFAULT 'normal' NOT NULL,
  "result_at" timestamptz DEFAULT now() NOT NULL,
  "ordered_by" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX "idx_lab_result_patient_result_at" ON "lab_result" ("patient_id", "result_at" DESC);
CREATE INDEX "idx_lab_result_order_item" ON "lab_result" ("lab_order_item_id");

