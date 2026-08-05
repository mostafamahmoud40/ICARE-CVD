import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { consultation } from './consultation.schema';
import { patient } from './patient.schema';
import { patientDocument } from './document.schema';

export const consultationCineMriAnalysis = pgTable(
  'consultation_cine_mri_analysis',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id')
      .references(() => patient.id, { onDelete: 'cascade' })
      .notNull(),
    consultationId: uuid('consultation_id').references(() => consultation.id, {
      onDelete: 'set null',
    }),
    edDocumentId: uuid('ed_document_id').references(() => patientDocument.id, {
      onDelete: 'set null',
    }),
    esDocumentId: uuid('es_document_id').references(() => patientDocument.id, {
      onDelete: 'set null',
    }),
    rawGifDocumentId: uuid('raw_gif_document_id').references(
      () => patientDocument.id,
      { onDelete: 'set null' },
    ),
    segGifDocumentId: uuid('seg_gif_document_id').references(
      () => patientDocument.id,
      { onDelete: 'set null' },
    ),
    segGridEdDocumentId: uuid('seg_grid_ed_document_id').references(
      () => patientDocument.id,
      { onDelete: 'set null' },
    ),
    segGridEsDocumentId: uuid('seg_grid_es_document_id').references(
      () => patientDocument.id,
      { onDelete: 'set null' },
    ),
    diagnosisClass: varchar('diagnosis_class', { length: 8 }).notNull(),
    analysisJson: text('analysis_json').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

export type ConsultationCineMriAnalysisRow =
  typeof consultationCineMriAnalysis.$inferSelect;
export type NewConsultationCineMriAnalysisRow =
  typeof consultationCineMriAnalysis.$inferInsert;
