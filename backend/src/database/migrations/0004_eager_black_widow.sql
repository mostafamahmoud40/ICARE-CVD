CREATE TYPE "public"."chief_complaint" AS ENUM('chest-pain', 'dyspnea', 'palpitations', 'syncope', 'leg-swelling', 'fatigue', 'constitutional-infective', 'peripheral-vascular', 'hepatic-congestion', 'jaundice', 'cyanosis', 'systemic-embolization', 'neurological', 'other');--> statement-breakpoint
CREATE TABLE "patient_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"chief_complaint" "chief_complaint" NOT NULL,
	"chief_complaint_other_text" varchar(255),
	"hpi_data" jsonb,
	"no_cardiac_history" boolean DEFAULT false NOT NULL,
	"past_cardiac_history" jsonb,
	"no_non_cardiac_history" boolean DEFAULT false NOT NULL,
	"past_non_cardiac_history" jsonb,
	"cardiovascular_risk_factors" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "patient_history_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "patient_history_other_text_required" CHECK (
		("chief_complaint" <> 'other'::chief_complaint AND "chief_complaint_other_text" IS NULL)
		OR
		("chief_complaint" = 'other'::chief_complaint AND "chief_complaint_other_text" IS NOT NULL)
	)
);
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'patient';--> statement-breakpoint
ALTER TABLE "patient_history" ADD CONSTRAINT "patient_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;