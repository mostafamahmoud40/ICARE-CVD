ALTER TABLE "doctor_assistant" ADD COLUMN IF NOT EXISTS "weekly_shifts" jsonb DEFAULT '[]'::jsonb NOT NULL;
