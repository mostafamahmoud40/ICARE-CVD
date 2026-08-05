CREATE TYPE "public"."queue_priority" AS ENUM('normal', 'urgent', 'emergency');--> statement-breakpoint
CREATE TYPE "public"."queue_status" AS ENUM('scheduled', 'arrived', 'waiting', 'in-consultation', 'completed', 'no-show', 'cancelled');--> statement-breakpoint
CREATE TABLE "patient_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"added_by_user_id" integer,
	"status" "queue_status" DEFAULT 'scheduled' NOT NULL,
	"priority" "queue_priority" DEFAULT 'normal' NOT NULL,
	"room_number" varchar(20),
	"estimated_duration_min" integer,
	"notes" text,
	"arrived_at" timestamp with time zone,
	"waiting_since" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "patient_queue_appointment_id_unique" UNIQUE("appointment_id")
);
--> statement-breakpoint
ALTER TABLE "vital_reading" ALTER COLUMN "time" SET DEFAULT TO_CHAR(CURRENT_TIME::time, 'HH24:MI'::text);--> statement-breakpoint
ALTER TABLE "patient_queue" ADD CONSTRAINT "patient_queue_appointment_id_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_queue" ADD CONSTRAINT "patient_queue_added_by_user_id_user_id_fk" FOREIGN KEY ("added_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;