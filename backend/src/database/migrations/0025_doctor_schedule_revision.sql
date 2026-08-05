CREATE TABLE IF NOT EXISTS "doctor_schedule_revision" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "doctor_id" uuid NOT NULL,
  "revision_number" integer NOT NULL,
  "snapshot" jsonb NOT NULL,
  "changed_by_user_id" integer,
  "changed_by_role" varchar(32),
  "change_source" varchar(64),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "doctor_schedule_revision" ADD CONSTRAINT "doctor_schedule_revision_doctor_id_doctor_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "doctor_schedule_revision" ADD CONSTRAINT "doctor_schedule_revision_changed_by_user_id_user_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "doctor_schedule_revision_doctor_revision_unique" ON "doctor_schedule_revision" ("doctor_id", "revision_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctor_schedule_revision_doctor_created_idx" ON "doctor_schedule_revision" ("doctor_id", "created_at" DESC);
