import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

/** Holds sign-up data until email OTP is verified; no `user` row until then. */
export const pendingRegistration = pgTable('pending_registration', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone'),
  password: text('password').notNull(),
  otpCode: text('otp_code').notNull(),
  otpExpiresAt: timestamp('otp_expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
