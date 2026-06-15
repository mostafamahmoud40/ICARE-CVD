ALTER TABLE "doctor" ADD COLUMN "title" varchar(120);
--> statement-breakpoint
ALTER TABLE "doctor" ADD COLUMN "about" text;
--> statement-breakpoint
ALTER TABLE "doctor" ADD COLUMN "clinic_name" varchar(200);
--> statement-breakpoint
ALTER TABLE "doctor" ADD COLUMN "clinic_location" varchar(300);
--> statement-breakpoint
ALTER TABLE "doctor" ADD COLUMN "license_number" varchar(64);
--> statement-breakpoint
ALTER TABLE "doctor" ADD COLUMN "clinic_consultation_fee" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "doctor" ADD COLUMN "online_consultation_fee" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "doctor" ADD COLUMN "languages" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "doctor" ADD CONSTRAINT "doctor_clinic_consultation_fee_check" CHECK ("doctor"."clinic_consultation_fee" >= 0 AND "doctor"."clinic_consultation_fee" <= 100000);
--> statement-breakpoint
ALTER TABLE "doctor" ADD CONSTRAINT "doctor_online_consultation_fee_check" CHECK ("doctor"."online_consultation_fee" >= 0 AND "doctor"."online_consultation_fee" <= 100000);
