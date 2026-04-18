import {
  check,
  date,
  decimal,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { patient } from './patient.schema';
import { user } from './users.schema';
import { consultation } from './consultation.schema';
import { vector } from './helpers/vector';

export const vitalSourceEnum = pgEnum('vital_source', [
  'home',
  'clinic',
  'hospital',
]);

export const vitalReading = pgTable(
  'vital_reading',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id')
      .references(() => patient.id, { onDelete: 'cascade' })
      .notNull(),
    date: date('date', { mode: 'date' })
      .notNull()
      .default(sql`CURRENT_DATE`),
    time: varchar('time', { length: 5 })
      .notNull()
      .default(sql`TO_CHAR(CURRENT_TIME, 'HH24:MI')`),
    source: vitalSourceEnum('source').notNull().default('home'),
    systolicBp: smallint('systolic_bp'),
    diastolicBp: smallint('diastolic_bp'),
    heartRate: smallint('heart_rate'),
    oxygenSaturation: smallint('oxygen_saturation'),
    temperature: decimal('temperature', { precision: 4, scale: 1 }),
    weight: decimal('weight', { precision: 5, scale: 1 }),
    bloodSugar: smallint('blood_sugar'),
    notes: text('notes'),
    notesEmbedding: vector(384),
    recordedByUserId: integer('recorded_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    consultationId: uuid('consultation_id').references(() => consultation.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      'bp_consistency',
      sql`(systolic_bp IS NULL AND diastolic_bp IS NULL) OR (systolic_bp IS NOT NULL AND diastolic_bp IS NOT NULL)`,
    ),
    check(
      'valid_ranges',
      sql`(${table.heartRate} IS NULL OR ${table.heartRate} BETWEEN 30 AND 220) AND (${table.oxygenSaturation} IS NULL OR ${table.oxygenSaturation} BETWEEN 70 AND 100) AND (${table.temperature} IS NULL OR ${table.temperature} BETWEEN 30 AND 45) AND (${table.bloodSugar} IS NULL OR ${table.bloodSugar} BETWEEN 40 AND 500)`,
    ),
  ],
);
