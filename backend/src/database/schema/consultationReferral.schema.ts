import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { consultation } from './consultation.schema';
import { patient } from './patient.schema';

export const referralUrgencyEnum = pgEnum('referral_urgency', [
  'routine',
  'urgent',
]);

export const referralStatusEnum = pgEnum('referral_status', [
  'pending',
  'scheduled',
  'completed',
  'cancelled',
]);

export const consultationReferral = pgTable('consultation_referral', {
  id: uuid('id').defaultRandom().primaryKey(),
  consultationId: uuid('consultation_id')
    .references(() => consultation.id, { onDelete: 'cascade' })
    .notNull(),
  patientId: uuid('patient_id')
    .references(() => patient.id, { onDelete: 'cascade' })
    .notNull(),
  specialty: varchar('specialty', { length: 120 }).notNull(),
  reason: text('reason').notNull(),
  urgency: referralUrgencyEnum('urgency').notNull().default('routine'),
  status: referralStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
