import { sql } from 'drizzle-orm';

import type { Database } from '../../database/drizzle.provider';

const PATIENT_NUMBER_PREFIX = 'P-';
const PATIENT_NUMBER_PAD = 3;

export function formatPatientNumber(sequence: number): string {
  return `${PATIENT_NUMBER_PREFIX}${String(sequence).padStart(PATIENT_NUMBER_PAD, '0')}`;
}

/** Idempotent — safe if Docker/DB started before migrations ran. */
export async function ensurePatientNumberSequence(db: Database): Promise<void> {
  await db.execute(sql`
    CREATE SEQUENCE IF NOT EXISTS patient_number_seq
  `);
  await db.execute(sql`
    SELECT setval(
      'patient_number_seq',
      GREATEST(
        (
          SELECT COALESCE(
            MAX(CAST(SUBSTRING(patient_number FROM 3) AS INTEGER)),
            0
          )
          FROM patient
          WHERE patient_number ~ '^P-[0-9]+$'
        ),
        1
      ),
      true
    )
  `);
}

export async function allocatePatientNumber(db: Database): Promise<string> {
  await ensurePatientNumberSequence(db);

  const result = await db.execute<{ n: string }>(
    sql`SELECT nextval('patient_number_seq')::text AS n`,
  );
  const raw = result.rows[0]?.n;
  const sequence = raw ? Number.parseInt(raw, 10) : 1;
  return formatPatientNumber(Number.isFinite(sequence) ? sequence : 1);
}
