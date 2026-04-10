CREATE TYPE "public"."document_category" AS ENUM('lab_report', 'imaging', 'ecg', 'prescription', 'other');--> statement-breakpoint
CREATE TABLE "doctor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"specialty" varchar(120),
	"experience_years" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "doctor_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "patient_document" ALTER COLUMN "s3_key" SET DATA TYPE varchar(500);--> statement-breakpoint
ALTER TABLE "doctor" ADD CONSTRAINT "doctor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;