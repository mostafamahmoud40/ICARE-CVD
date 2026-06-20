import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { consultation } from './consultation.schema';
import { patient } from './patient.schema';
import { patientDocument } from './document.schema';

export const consultationCtAnalysis = pgTable('consultation_ct_analysis', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id')
    .references(() => patient.id, { onDelete: 'cascade' })
    .notNull(),
  consultationId: uuid('consultation_id').references(() => consultation.id, {
    onDelete: 'set null',
  }),
  sourceDocumentId: uuid('source_document_id').references(
    () => patientDocument.id,
    { onDelete: 'set null' },
  ),
  maskDocumentId: uuid('mask_document_id').references(
    () => patientDocument.id,
    { onDelete: 'set null' },
  ),
  axialSliceDocumentId: uuid('axial_slice_document_id').references(
    () => patientDocument.id,
    { onDelete: 'set null' },
  ),
  coronalSliceDocumentId: uuid('coronal_slice_document_id').references(
    () => patientDocument.id,
    { onDelete: 'set null' },
  ),
  sagittalSliceDocumentId: uuid('sagittal_slice_document_id').references(
    () => patientDocument.id,
    { onDelete: 'set null' },
  ),
  fileName: varchar('file_name', { length: 255 }),
  analysisJson: text('analysis_json').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type ConsultationCtAnalysisRow =
  typeof consultationCtAnalysis.$inferSelect;
export type NewConsultationCtAnalysisRow =
  typeof consultationCtAnalysis.$inferInsert;
