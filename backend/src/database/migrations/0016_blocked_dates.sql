-- Migration: Create blocked_dates table
-- Description: Separate table for doctor's blocked/vacation dates

CREATE TABLE "blocked_dates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "doctor_id" uuid NOT NULL REFERENCES "doctor"("id") ON DELETE CASCADE,
  "date" date NOT NULL,
  "reason" varchar(100),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Composite unique constraint: doctor can only block same date once
CREATE UNIQUE INDEX "blocked_dates_doctor_date_unique" 
  ON "blocked_dates" ("doctor_id", "date");

-- Index for querying by date range (e.g., get blocked dates for next month)
CREATE INDEX "blocked_dates_date_idx" 
  ON "blocked_dates" ("date");

-- Index for querying by doctor
CREATE INDEX "blocked_dates_doctor_idx" 
  ON "blocked_dates" ("doctor_id");
