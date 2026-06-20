import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { consultation } from './consultation.schema';
import { patient } from './patient.schema';
import { patientDocument } from './document.schema';

export const consultationEcgAnalysis = pgTable('consultation_ecg_analysis', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id')
    .references(() => patient.id, { onDelete: 'cascade' })
    .notNull(),
  consultationId: uuid('consultation_id').references(() => consultation.id, {
    onDelete: 'set null',
  }),
  heaDocumentId: uuid('hea_document_id').references(() => patientDocument.id, {
    onDelete: 'set null',
  }),
  datDocumentId: uuid('dat_document_id').references(() => patientDocument.id, {
    onDelete: 'set null',
  }),
  recordName: varchar('record_name', { length: 255 }),
  fileName: varchar('file_name', { length: 255 }),
  analysisJson: text('analysis_json').notNull(),
  aiReportJson: text('ai_report_json'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type ConsultationEcgAnalysisRow =
  typeof consultationEcgAnalysis.$inferSelect;
export type NewConsultationEcgAnalysisRow =
  typeof consultationEcgAnalysis.$inferInsert;
