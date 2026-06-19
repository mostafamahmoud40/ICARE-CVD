import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { patient } from './patient.schema';
import { patientDocument } from './document.schema';
import { consultation } from './consultation.schema';

/** Structured AI output for an uploaded lab report (OCR + LLM). */
export const labReportPanel = pgTable('lab_report_panel', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id')
    .references(() => patient.id, { onDelete: 'cascade' })
    .notNull(),
  documentId: uuid('document_id').references(() => patientDocument.id, {
    onDelete: 'set null',
  }),
  consultationId: uuid('consultation_id').references(() => consultation.id, {
    onDelete: 'set null',
  }),
  panelTitle: varchar('panel_title', { length: 255 }),
  /** Full structured extraction (facility, patient stub, results array). */
  analysisJson: text('analysis_json').notNull(),
  summary: text('summary'),
  orderedBy: text('ordered_by'),
  resultAt: timestamp('result_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type LabReportPanelRow = typeof labReportPanel.$inferSelect;
export type NewLabReportPanelRow = typeof labReportPanel.$inferInsert;
