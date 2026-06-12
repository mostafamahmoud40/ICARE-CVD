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
