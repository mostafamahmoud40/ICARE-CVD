ALTER TYPE "public"."patient_exercise_frequency" ADD VALUE IF NOT EXISTS 'rarely-monthly';
ALTER TYPE "public"."patient_exercise_frequency" ADD VALUE IF NOT EXISTS 'occasional-monthly';
ALTER TYPE "public"."patient_exercise_frequency" ADD VALUE IF NOT EXISTS '1-week';
ALTER TYPE "public"."patient_exercise_frequency" ADD VALUE IF NOT EXISTS 'daily';
