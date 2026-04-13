import {
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { appointment } from './appointment.schema';
import { patientDocument } from './document.schema';

export const appointmentAttachment = pgTable('appointment_attachment', {
  id: uuid('id').defaultRandom().primaryKey(),
  appointmentId: uuid('appointment_id')
    .references(() => appointment.id, { onDelete: 'cascade' })
    .notNull(),
  documentId: uuid('document_id')
    .references(() => patientDocument.id, { onDelete: 'cascade' })
    .notNull(),
  category: text('category').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type AppointmentAttachmentRow = typeof appointmentAttachment.$inferSelect;
export type NewAppointmentAttachmentRow = typeof appointmentAttachment.$inferInsert;
