ALTER TABLE "consultation" ADD COLUMN IF NOT EXISTS "consultation_medical_history" text;
ALTER TABLE "consultation" ADD COLUMN IF NOT EXISTS "consultation_procedure_details" text;
