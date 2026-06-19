import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { consultation } from './consultation.schema';
import { patient } from './patient.schema';
import { patientDocument } from './document.schema';

export const consultationEchoAnalysis = pgTable('consultation_echo_analysis', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id')
    .references(() => patient.id, { onDelete: 'cascade' })
    .notNull(),
  consultationId: uuid('consultation_id').references(() => consultation.id, {
    onDelete: 'set null',
  }),
  videoDocumentId: uuid('video_document_id').references(() => patientDocument.id, {
    onDelete: 'set null',
  }),
  overlayGifDocumentId: uuid('overlay_gif_document_id').references(
    () => patientDocument.id,
    { onDelete: 'set null' },
  ),
  frameVizDocumentId: uuid('frame_viz_document_id').references(
    () => patientDocument.id,
    { onDelete: 'set null' },
  ),
  fileName: varchar('file_name', { length: 255 }),
  analysisJson: text('analysis_json').notNull(),
  aiReport: text('ai_report'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type ConsultationEchoAnalysisRow =
  typeof consultationEchoAnalysis.$inferSelect;
export type NewConsultationEchoAnalysisRow =
  typeof consultationEchoAnalysis.$inferInsert;
