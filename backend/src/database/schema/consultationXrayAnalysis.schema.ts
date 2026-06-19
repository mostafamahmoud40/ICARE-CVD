import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { consultation } from './consultation.schema';
import { patient } from './patient.schema';
import { patientDocument } from './document.schema';

export const consultationXrayAnalysis = pgTable('consultation_xray_analysis', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id')
    .references(() => patient.id, { onDelete: 'cascade' })
    .notNull(),
  consultationId: uuid('consultation_id').references(() => consultation.id, {
    onDelete: 'set null',
  }),
  originalDocumentId: uuid('original_document_id').references(
    () => patientDocument.id,
    { onDelete: 'set null' },
  ),
  annotatedDocumentId: uuid('annotated_document_id').references(
    () => patientDocument.id,
    { onDelete: 'set null' },
  ),
  fileName: varchar('file_name', { length: 255 }),
  riskLevel: text('risk_level').notNull().default('normal'),
  analysisJson: text('analysis_json').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type ConsultationXrayAnalysisRow =
  typeof consultationXrayAnalysis.$inferSelect;
export type NewConsultationXrayAnalysisRow =
  typeof consultationXrayAnalysis.$inferInsert;
