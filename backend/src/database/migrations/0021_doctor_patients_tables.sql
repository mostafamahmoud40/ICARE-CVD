-- Migration: doctor-patients section — new tables + column additions
-- Tables: diagnosis, consultation, consultation_diagnosis, consultation_prescription, consultation_referral
-- Modifications: patient (risk_level, avatar_url, emergency contacts), patient_document (enum, new cols), medication (other, last_taken_at), vital_reading (recorded_by, consultation_id)

-- 1. New enums
CREATE TYPE "public"."patient_risk_level" AS ENUM('low', 'moderate', 'high');
CREATE TYPE "public"."assignment_status" AS ENUM('active', 'archived');
CREATE TYPE "public"."diagnosis_type" AS ENUM('primary', 'secondary', 'differential');
CREATE TYPE "public"."diagnosis_severity" AS ENUM('mild', 'moderate', 'severe', 'critical');
CREATE TYPE "public"."diagnosis_confirmation" AS ENUM('confirmed', 'unconfirmed', 'presumed');
CREATE TYPE "public"."diagnosis_status" AS ENUM('active', 'resolved', 'chronic');
CREATE TYPE "public"."laterality_type" AS ENUM('unspecified', 'left', 'right', 'bilateral', 'other');
CREATE TYPE "public"."consultation_visit_type" AS ENUM('follow-up', 'new', 'walk-in', 'post-procedure', 'urgent');
CREATE TYPE "public"."consultation_status" AS ENUM('in-progress', 'completed', 'cancelled');
CREATE TYPE "public"."referral_urgency" AS ENUM('routine', 'urgent');
CREATE TYPE "public"."referral_status" AS ENUM('pending', 'scheduled', 'completed', 'cancelled');

-- 2. Extend existing enums
ALTER TYPE "public"."medication_type" ADD VALUE IF NOT EXISTS 'other';
ALTER TYPE "public"."document_category" ADD VALUE IF NOT EXISTS 'referral' BEFORE 'other';

-- 3. New tables

CREATE TABLE IF NOT EXISTS "diagnosis" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL REFERENCES "public"."patient"("id") ON DELETE cascade,
  "icd_code" varchar(20) NOT NULL,
  "description" text NOT NULL,
  "type" "diagnosis_type" NOT NULL,
  "severity" "diagnosis_severity" NOT NULL,
  "confirmation" "diagnosis_confirmation" NOT NULL,
  "onset_date" date,
  "status" "diagnosis_status" DEFAULT 'active' NOT NULL,
  "laterality" "laterality_type",
  "nyha_class" varchar(5),
  "clinical_notes" text,
  "diagnosed_by_doctor_id" uuid REFERENCES "public"."doctor"("id") ON DELETE set null,
  "diagnosed_at" timestamp with time zone DEFAULT now() NOT NULL,
  "resolved_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "consultation" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "appointment_id" uuid REFERENCES "public"."appointment"("id") ON DELETE set null,
  "patient_id" uuid NOT NULL REFERENCES "public"."patient"("id") ON DELETE cascade,
  "doctor_id" uuid NOT NULL REFERENCES "public"."doctor"("id") ON DELETE cascade,
  "visit_type" "consultation_visit_type" NOT NULL,
  "chief_complaint" text,
  "history_of_present_illness" text,
  "physical_exam" text,
  "plan" text,
  "follow_up_timeframe" varchar(100),
  "follow_up_instructions" text,
  "notes" text,
  "duration_minutes" smallint,
  "status" "consultation_status" DEFAULT 'in-progress' NOT NULL,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "consultation_diagnosis" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "consultation_id" uuid NOT NULL REFERENCES "public"."consultation"("id") ON DELETE cascade,
  "diagnosis_id" uuid NOT NULL REFERENCES "public"."diagnosis"("id") ON DELETE cascade,
  "type" "diagnosis_type" NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "consultation_diagnosis_unique" UNIQUE ("consultation_id", "diagnosis_id")
);

CREATE TABLE IF NOT EXISTS "consultation_prescription" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "consultation_id" uuid NOT NULL REFERENCES "public"."consultation"("id") ON DELETE cascade,
  "medication_id" uuid NOT NULL REFERENCES "public"."medication"("id") ON DELETE cascade,
  "is_new" boolean DEFAULT true NOT NULL,
  "duration" varchar(50),
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "consultation_prescription_unique" UNIQUE ("consultation_id", "medication_id")
);

CREATE TABLE IF NOT EXISTS "consultation_referral" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "consultation_id" uuid NOT NULL REFERENCES "public"."consultation"("id") ON DELETE cascade,
  "patient_id" uuid NOT NULL REFERENCES "public"."patient"("id") ON DELETE cascade,
  "specialty" varchar(120) NOT NULL,
  "reason" text NOT NULL,
  "urgency" "referral_urgency" DEFAULT 'routine' NOT NULL,
  "status" "referral_status" DEFAULT 'pending' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 4. Doctor-patient assignment table

CREATE TABLE IF NOT EXISTS "doctor_patient" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "doctor_id" uuid NOT NULL REFERENCES "public"."doctor"("id") ON DELETE cascade,
  "patient_id" uuid NOT NULL REFERENCES "public"."patient"("id") ON DELETE cascade,
  "assigned_by_user_id" integer REFERENCES "public"."user"("id") ON DELETE set null,
  "status" "assignment_status" DEFAULT 'active' NOT NULL,
  "is_primary" boolean DEFAULT false NOT NULL,
  "notes" text,
  "assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
  "archived_at" timestamp with time zone,
  CONSTRAINT "doctor_patient_unique" UNIQUE ("doctor_id", "patient_id")
);

-- 5. Add columns to existing tables

ALTER TABLE "patient" ADD COLUMN IF NOT EXISTS "risk_level" "patient_risk_level" DEFAULT 'low' NOT NULL;
ALTER TABLE "patient" ADD COLUMN IF NOT EXISTS "avatar_url" varchar(500);

ALTER TABLE "medication" ADD COLUMN IF NOT EXISTS "last_taken_at" timestamp with time zone;

ALTER TABLE "patient_document" ADD COLUMN IF NOT EXISTS "patient_id" uuid REFERENCES "public"."patient"("id") ON DELETE cascade;
ALTER TABLE "patient_document" ADD COLUMN IF NOT EXISTS "title" varchar(255);
ALTER TABLE "patient_document" ADD COLUMN IF NOT EXISTS "uploaded_by_user_id" integer REFERENCES "public"."user"("id") ON DELETE set null;
ALTER TABLE "patient_document" ALTER COLUMN "document_category" SET DATA TYPE "public"."document_category" USING "document_category"::"public"."document_category";

ALTER TABLE "vital_reading" ADD COLUMN IF NOT EXISTS "recorded_by_user_id" integer REFERENCES "public"."user"("id") ON DELETE set null;
ALTER TABLE "vital_reading" ADD COLUMN IF NOT EXISTS "consultation_id" uuid REFERENCES "public"."consultation"("id") ON DELETE set null;
