CREATE TYPE "public"."medication_compliance" AS ENUM('good', 'poor');--> statement-breakpoint
CREATE TYPE "public"."medication_type" AS ENUM('antihypertensives', 'antiplatelets', 'anticoagulants', 'statins', 'antiarrhythmics', 'diuretics', 'diabetes_medications');--> statement-breakpoint
CREATE TABLE "medication" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(150) NOT NULL,
	"dose" varchar(100) NOT NULL,
	"frequency" varchar(50) NOT NULL,
	"type" "medication_type" NOT NULL,
	"compliance" "medication_compliance",
	"side_effects" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "medication" ADD CONSTRAINT "medication_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;