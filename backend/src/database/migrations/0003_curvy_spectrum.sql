CREATE TYPE "public"."patient_alcohol_consumption" AS ENUM('none', 'rarely', 'weekly', 'daily');--> statement-breakpoint
CREATE TYPE "public"."patient_blood_type" AS ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');--> statement-breakpoint
CREATE TYPE "public"."patient_dietary_habits" AS ENUM('balanced', 'high_salt', 'high_fat', 'high_both', 'other');--> statement-breakpoint
CREATE TYPE "public"."patient_exercise_duration" AS ENUM('under-30', '30-60', 'over-60');--> statement-breakpoint
CREATE TYPE "public"."patient_exercise_frequency" AS ENUM('none', '1-2', '3-4', '5+');--> statement-breakpoint
CREATE TYPE "public"."patient_exercise_type" AS ENUM('walking', 'gym', 'swimming', 'cycling', 'other');--> statement-breakpoint
CREATE TYPE "public"."patient_gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."patient_marital_status" AS ENUM('single', 'married', 'divorced', 'widowed');--> statement-breakpoint
CREATE TYPE "public"."patient_physical_activity_level" AS ENUM('low', 'moderate', 'high');--> statement-breakpoint
CREATE TYPE "public"."patient_recreational_drug_use" AS ENUM('no', 'sometimes', 'yes');--> statement-breakpoint
CREATE TYPE "public"."patient_smoking_status" AS ENUM('never', 'former-5', 'former-10', 'former-15', 'former-20', 'current-5', 'current-10', 'current-15', 'current-20');--> statement-breakpoint
CREATE TYPE "public"."patient_stress_level" AS ENUM('low', 'moderate', 'high');--> statement-breakpoint
CREATE TABLE "patient" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"date_of_birth" date NOT NULL,
	"national_id" varchar(50),
	"gender" "patient_gender" NOT NULL,
	"blood_type" "patient_blood_type",
	"address" text,
	"height_cm" numeric(5, 1),
	"weight_kg" numeric(5, 1),
	"bmi" numeric(4, 1) GENERATED ALWAYS AS (CASE
        WHEN "height_cm" IS NOT NULL
         AND "weight_kg" IS NOT NULL
         AND "height_cm" > 0::numeric
        THEN ROUND(
          ("weight_kg"::numeric
            / POWER("height_cm"::numeric / 100.0, 2))::numeric,
          1
        )
        ELSE NULL
      END) STORED,
	"marital_status" "patient_marital_status",
	"occupation" varchar(100),
	"smoking_status" "patient_smoking_status",
	"alcohol_consumption" "patient_alcohol_consumption",
	"caffeine_intake" smallint DEFAULT 0 NOT NULL,
	"recreational_drug_use" "patient_recreational_drug_use",
	"exercise_frequency" "patient_exercise_frequency",
	"exercise_duration" "patient_exercise_duration",
	"exercise_type" "patient_exercise_type",
	"physical_activity_level" "patient_physical_activity_level",
	"dietary_habits" "patient_dietary_habits",
	"high_salt_diet" boolean GENERATED ALWAYS AS (("dietary_habits" IS NOT NULL AND "dietary_habits" IN ('high_salt'::patient_dietary_habits, 'high_both'::patient_dietary_habits))) STORED NOT NULL,
	"high_fat_diet" boolean GENERATED ALWAYS AS (("dietary_habits" IS NOT NULL AND "dietary_habits" IN ('high_fat'::patient_dietary_habits, 'high_both'::patient_dietary_habits))) STORED NOT NULL,
	"stress_level" "patient_stress_level",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "patient_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;