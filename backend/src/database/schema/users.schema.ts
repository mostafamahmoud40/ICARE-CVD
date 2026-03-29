import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

/** Starter table — rename or replace as you model your domain. */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
