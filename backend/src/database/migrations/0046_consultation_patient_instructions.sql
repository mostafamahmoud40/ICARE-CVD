ALTER TABLE "consultation"
  ADD COLUMN IF NOT EXISTS "patient_diagnosis_summary" text,
  ADD COLUMN IF NOT EXISTS "patient_lifestyle_advice" text,
  ADD COLUMN IF NOT EXISTS "patient_danger_signs" text;
