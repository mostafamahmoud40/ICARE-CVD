ALTER TABLE "doctor_schedule" ADD COLUMN IF NOT EXISTS "paused_period_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "doctor_schedule" ADD COLUMN IF NOT EXISTS "doctor_arrival_by_weekday" jsonb DEFAULT '{}'::jsonb NOT NULL;
