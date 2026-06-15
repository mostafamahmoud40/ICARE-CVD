import {
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { user } from './users.schema';

/** Doctor profile linked 1:1 with user row. */
export const doctor = pgTable('doctor', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: integer('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  specialty: varchar('specialty', { length: 120 }),
  title: varchar('title', { length: 120 }),
  experienceYears: smallint('experience_years').notNull().default(0),
  /** clinic | virtual | both — which appointment types this doctor accepts. */
  acceptedVisitModes: varchar('accepted_visit_modes', { length: 16 })
    .notNull()
    .default('both'),
  about: text('about'),
  clinicName: varchar('clinic_name', { length: 200 }),
  clinicLocation: varchar('clinic_location', { length: 300 }),
  licenseNumber: varchar('license_number', { length: 64 }),
  clinicConsultationFee: integer('clinic_consultation_fee').notNull().default(0),
  onlineConsultationFee: integer('online_consultation_fee').notNull().default(0),
  languages: jsonb('languages').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
