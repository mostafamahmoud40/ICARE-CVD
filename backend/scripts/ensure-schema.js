/**
 * Idempotent SQL patches applied before app start (Docker / CI).
 * drizzle-kit push can fail without a TTY when it prompts for data-loss.
 */
const { Client } = require('pg');

const PATCHES = [
  `ALTER TABLE "doctor_schedule" ADD COLUMN IF NOT EXISTS "paused_period_ids" jsonb DEFAULT '[]'::jsonb NOT NULL`,
  `ALTER TABLE "doctor_schedule" ADD COLUMN IF NOT EXISTS "doctor_arrival_by_weekday" jsonb DEFAULT '{}'::jsonb NOT NULL`,
  `CREATE TABLE IF NOT EXISTS "schedule_day_extra" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "doctor_id" uuid NOT NULL REFERENCES "doctor"("id") ON DELETE CASCADE,
    "date" date NOT NULL,
    "start_time" varchar(5) NOT NULL,
    "end_time" varchar(5) NOT NULL,
    "reason" varchar(200),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "schedule_day_extra_doctor_date_idx" ON "schedule_day_extra" ("doctor_id", "date")`,
  `CREATE TABLE IF NOT EXISTS "doctor_schedule_revision" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "doctor_id" uuid NOT NULL REFERENCES "doctor"("id") ON DELETE CASCADE,
    "revision_number" integer NOT NULL,
    "snapshot" jsonb NOT NULL,
    "changed_by_user_id" integer REFERENCES "user"("id") ON DELETE SET NULL,
    "changed_by_role" varchar(32),
    "change_source" varchar(64),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "doctor_schedule_revision_doctor_revision_unique" ON "doctor_schedule_revision" ("doctor_id", "revision_number")`,
  `CREATE INDEX IF NOT EXISTS "doctor_schedule_revision_doctor_created_idx" ON "doctor_schedule_revision" ("doctor_id", "created_at" DESC)`,
  `ALTER TABLE "doctor" ADD COLUMN IF NOT EXISTS "accepted_visit_modes" varchar(16) DEFAULT 'both' NOT NULL`,
  `CREATE TABLE IF NOT EXISTS "doctor_assistant" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "doctor_id" uuid NOT NULL REFERENCES "doctor"("id") ON DELETE CASCADE,
    "assistant_id" uuid NOT NULL REFERENCES "assistant"("id") ON DELETE CASCADE,
    "linked_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "doctor_assistant_unique" ON "doctor_assistant" ("doctor_id", "assistant_id")`,
  `ALTER TABLE "doctor" ADD COLUMN IF NOT EXISTS "title" varchar(120)`,
  `ALTER TABLE "doctor" ADD COLUMN IF NOT EXISTS "about" text`,
  `ALTER TABLE "doctor" ADD COLUMN IF NOT EXISTS "clinic_name" varchar(200)`,
  `ALTER TABLE "doctor" ADD COLUMN IF NOT EXISTS "clinic_location" varchar(300)`,
  `ALTER TABLE "doctor" ADD COLUMN IF NOT EXISTS "license_number" varchar(64)`,
  `ALTER TABLE "doctor" ADD COLUMN IF NOT EXISTS "clinic_consultation_fee" integer DEFAULT 0 NOT NULL`,
  `ALTER TABLE "doctor" ADD COLUMN IF NOT EXISTS "online_consultation_fee" integer DEFAULT 0 NOT NULL`,
  `ALTER TABLE "doctor" ADD COLUMN IF NOT EXISTS "languages" jsonb DEFAULT '[]'::jsonb NOT NULL`,
  `DO $$ BEGIN
    CREATE TYPE "message_attachment_type_enum" AS ENUM ('image', 'file');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `CREATE TABLE IF NOT EXISTS "message_attachments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "message_id" integer NOT NULL REFERENCES "messages"("id") ON DELETE CASCADE,
    "file_name" varchar(255) NOT NULL,
    "mime_type" varchar(120) NOT NULL,
    "size_bytes" integer NOT NULL,
    "s3_key" varchar(500) NOT NULL,
    "attachment_type" "message_attachment_type_enum" NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "message_attachments_message_id_idx" ON "message_attachments" ("message_id")`,
  `CREATE TABLE IF NOT EXISTS "notification" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL REFERENCES "user"("id") ON DELETE cascade,
    "kind" text NOT NULL,
    "title" text,
    "body" text NOT NULL,
    "href" text,
    "read" boolean DEFAULT false NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "notification_user_id_idx" ON "notification" ("user_id")`,
  `CREATE INDEX IF NOT EXISTS "notification_user_read_idx" ON "notification" ("user_id", "read")`,
  `CREATE TABLE IF NOT EXISTS "push_subscription" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL REFERENCES "user"("id") ON DELETE cascade,
    "endpoint" text NOT NULL UNIQUE,
    "p256dh" text NOT NULL,
    "auth" text NOT NULL,
    "user_agent" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "push_subscription_user_id_idx" ON "push_subscription" ("user_id")`,
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    for (const sql of PATCHES) {
      await client.query(sql);
    }
  } finally {
    await client.end();
  }

  console.log(`Applied ${PATCHES.length} schema patch(es).`);
}

main().catch((err) => {
  console.error('Schema patch failed:', err);
  process.exit(1);
});
