-- AI registration summary on patient: readable text + vector for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "patient" ADD COLUMN IF NOT EXISTS "ai_registration_summary" text;
ALTER TABLE "patient" ADD COLUMN IF NOT EXISTS "ai_registration_summary_embedding" vector(384);
