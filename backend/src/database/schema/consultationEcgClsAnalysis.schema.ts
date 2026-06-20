import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { consultation } from './consultation.schema';
import { patient } from './patient.schema';
import { patientDocument } from './document.schema';

export const consultationEcgClsAnalysis = pgTable(
  'consultation_ecg_cls_analysis',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id')
      .references(() => patient.id, { onDelete: 'cascade' })
      .notNull(),
    consultationId: uuid('consultation_id').references(() => consultation.id, {
      onDelete: 'set null',
    }),
    inputSource: varchar('input_source', { length: 16 }).notNull(),
    imageDocumentId: uuid('image_document_id').references(
      () => patientDocument.id,
      { onDelete: 'set null' },
    ),
    heaDocumentId: uuid('hea_document_id').references(() => patientDocument.id, {
      onDelete: 'set null',
    }),
    datDocumentId: uuid('dat_document_id').references(() => patientDocument.id, {
      onDelete: 'set null',
    }),
    previewDocumentId: uuid('preview_document_id').references(
      () => patientDocument.id,
      { onDelete: 'set null' },
    ),
    fileName: varchar('file_name', { length: 255 }),
    classificationJson: text('classification_json').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

export type ConsultationEcgClsAnalysisRow =
  typeof consultationEcgClsAnalysis.$inferSelect;
export type NewConsultationEcgClsAnalysisRow =
  typeof consultationEcgClsAnalysis.$inferInsert;
