/**
 * Lightweight in-process event bus for patient data changes.
 *
 * Any service that writes patient clinical data (consultations, lab results,
 * medications, vitals, clinical notes) should call `notifyPatientDataChanged`
 * after a successful write.  The DoctorIndexerService listens and automatically
 * re-indexes the affected patient in Chroma so the doctor agent's RAG stays
 * up-to-date in real time.
 *
 * No extra packages required — plain Node.js EventEmitter.
 */

import { EventEmitter } from 'events';

export const PATIENT_DATA_CHANGED = 'patient.data.changed';

export type PatientDataChangedPayload = {
  patientId: string;
  /** Optional hint — which type of data changed (for future granularity). */
  dataType?:
    | 'consultation'
    | 'lab_result'
    | 'medication'
    | 'vital'
    | 'clinical_note'
    | 'procedure'
    | 'diagnosis'
    | 'allergy'
    | 'other';
};

class PatientDataEventBus extends EventEmitter {}

export const patientDataEventBus = new PatientDataEventBus();
patientDataEventBus.setMaxListeners(50);

/**
 * Fire-and-forget: emit the event on the next iteration of the event loop so
 * the calling service's HTTP response is returned immediately.
 */
export function notifyPatientDataChanged(
  patientId: string,
  dataType?: PatientDataChangedPayload['dataType'],
): void {
  if (!patientId) return;
  setImmediate(() =>
    patientDataEventBus.emit(PATIENT_DATA_CHANGED, {
      patientId,
      dataType,
    } satisfies PatientDataChangedPayload),
  );
}
