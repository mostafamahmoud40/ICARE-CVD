CREATE TYPE "public"."allergy_category" AS ENUM('drug', 'food', 'other');--> statement-breakpoint
CREATE TABLE "allergy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"category" "allergy_category" NOT NULL,
	"allergen" varchar(150) NOT NULL,
	"reaction" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "allergy" ADD CONSTRAINT "allergy_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;