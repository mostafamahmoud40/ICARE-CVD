import {
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { patient } from './patient.schema';
import { doctor } from './doctor.schema';
import { appointment } from './appointment.schema';

export const consultationVisitTypeEnum = pgEnum('consultation_visit_type', [
  'follow-up',
  'new',
  'walk-in',
  'post-procedure',
  'urgent',
]);

export const consultationStatusEnum = pgEnum('consultation_status', [
  'in-progress',
  'completed',
  'cancelled',
]);

export const consultation = pgTable('consultation', {
  id: uuid('id').defaultRandom().primaryKey(),
  appointmentId: uuid('appointment_id').references(() => appointment.id, {
    onDelete: 'set null',
  }),
  patientId: uuid('patient_id')
    .references(() => patient.id, { onDelete: 'cascade' })
    .notNull(),
  doctorId: uuid('doctor_id')
    .references(() => doctor.id, { onDelete: 'cascade' })
    .notNull(),
  visitType: consultationVisitTypeEnum('visit_type').notNull(),
  chiefComplaint: text('chief_complaint'),
  historyOfPresentIllness: text('history_of_present_illness'),
  /** JSON snapshot of structured chief-complaint / OPQRST fields. */
  chiefComplaintStructured: text('chief_complaint_structured'),
  physicalExam: text('physical_exam'),
  plan: text('plan'),
  followUpTimeframe: varchar('follow_up_timeframe', { length: 100 }),
  followUpInstructions: text('follow_up_instructions'),
  notes: text('notes'),
  /** JSON array of home-monitoring instructions for the patient. */
  homeMonitoring: text('home_monitoring'),
  /** JSON snapshot of consultation medical-background questionnaire. */
  consultationMedicalHistory: text('consultation_medical_history'),
  /** JSON snapshot of planned procedure details for this visit. */
  consultationProcedureDetails: text('consultation_procedure_details'),
  /** Plain-language diagnosis shown on the patient visit report. */
  patientDiagnosisSummary: text('patient_diagnosis_summary'),
  /** Diet, activity, and lifestyle guidance for the patient report. */
  patientLifestyleAdvice: text('patient_lifestyle_advice'),
  /** Red-flag symptoms — go to emergency department immediately. */
  patientDangerSigns: text('patient_danger_signs'),
  durationMinutes: smallint('duration_minutes'),
  status: consultationStatusEnum('status').notNull().default('in-progress'),
  startedAt: timestamp('started_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  /** Set when the doctor completes & signs — patient report becomes visible. */
  reportPublishedAt: timestamp('report_published_at', { withTimezone: true }),
  /** JSON overrides for derived report sections (medical history, AI summaries, etc.). */
  reportOverrides: text('report_overrides'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
