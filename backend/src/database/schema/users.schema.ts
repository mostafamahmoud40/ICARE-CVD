import {
  boolean,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

/** Allowed user roles in the system. */
export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'patient',
  'assistant',
  'doctor',
]);

/** `user` table — matches domain ER (PostgreSQL quotes this identifier). */
export const user = pgTable('user', {
  id: serial('id').primaryKey(),
  isActive: boolean('is_active').notNull().default(true),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  role: userRoleEnum('role').notNull().default('patient'),
  password: text('password').notNull(),
  refreshTokenHash: text('refresh_token_hash'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
    withTimezone: true,
  }),
});
