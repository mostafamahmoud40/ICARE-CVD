import {
  integer,
  pgTable,
  smallint,
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
  experienceYears: smallint('experience_years').notNull().default(0),
  /** clinic | virtual | both — which appointment types this doctor accepts. */
  acceptedVisitModes: varchar('accepted_visit_modes', { length: 16 })
    .notNull()
    .default('both'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
