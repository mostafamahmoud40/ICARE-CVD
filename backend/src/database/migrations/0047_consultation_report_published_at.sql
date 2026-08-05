ALTER TABLE "consultation"
  ADD COLUMN IF NOT EXISTS "report_published_at" timestamptz;

-- Existing completed visits were already shared with patients.
UPDATE "consultation"
SET "report_published_at" = COALESCE("completed_at", "started_at", now())
WHERE "status" = 'completed'
  AND "report_published_at" IS NULL;
