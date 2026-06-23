import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import { DRIZZLE } from '../../../database/drizzle.provider';
import type { Database } from '../../../database/drizzle.provider';
import {
  appointment,
  consultation,
  doctor,
  doctorPatient,
} from '../../../database/schema';
import {
  PATIENT_DATA_CHANGED,
  patientDataEventBus,
  type PatientDataChangedPayload,
} from '../../../shared/patient-data-notifier';
import { ChromaService } from '../chroma/chroma.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { DoctorToolsService } from './langchain/doctor-tools.service';

export const CHROMA_COLLECTION_DOCTOR_PATIENTS = 'icare_doctor_patients';

/** How long (ms) before a full doctor index is considered stale (bulk re-index). */
const INDEX_TTL_MS = 30 * 60 * 1_000; // 30 minutes

@Injectable()
export class DoctorIndexerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DoctorIndexerService.name);

  /** doctorId → last bulk-indexed timestamp */
  private readonly lastIndexed = new Map<string, number>();

  /** Bound handler reference so we can unregister it on destroy. */
  private readonly dataChangedHandler = (payload: PatientDataChangedPayload) => {
    void this.handlePatientDataChanged(payload);
  };

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly chromaService: ChromaService,
    private readonly embeddingService: EmbeddingService,
    private readonly doctorTools: DoctorToolsService,
  ) {}

  onModuleInit() {
    patientDataEventBus.on(PATIENT_DATA_CHANGED, this.dataChangedHandler);
    this.logger.log('Patient data change listener registered');
  }

  onModuleDestroy() {
    patientDataEventBus.off(PATIENT_DATA_CHANGED, this.dataChangedHandler);
  }

  get isEnabled(): boolean {
    return this.chromaService.isSearchEnabled;
  }

  // ─── Bulk index (TTL-gated) ────────────────────────────────────────────────

  /** Index all accessible patients for a doctor. Skips if still fresh. */
  async ensureIndexed(doctorId: string): Promise<void> {
    if (!this.isEnabled) return;
    const lastTs = this.lastIndexed.get(doctorId) ?? 0;
    if (Date.now() - lastTs < INDEX_TTL_MS) return;
    try {
      await this.indexAllPatientsForDoctor(doctorId);
      this.lastIndexed.set(doctorId, Date.now());
    } catch (err) {
      this.logger.warn(`Bulk doctor index failed for ${doctorId}: ${String(err)}`);
    }
  }

  // ─── Real-time per-patient update ─────────────────────────────────────────

  /** Called automatically whenever patient data changes. */
  private async handlePatientDataChanged(
    payload: PatientDataChangedPayload,
  ): Promise<void> {
    if (!this.isEnabled) return;
    if (!payload.patientId) return;

    try {
      const doctorIds = await this.getDoctorIdsForPatient(payload.patientId);
      if (doctorIds.length === 0) return;

      this.logger.debug(
        `Re-indexing patient ${payload.patientId} for ${doctorIds.length} doctor(s) — trigger: ${payload.dataType ?? 'unknown'}`,
      );

      await Promise.all(
        doctorIds.map((doctorId) =>
          this.reIndexSinglePatient(doctorId, payload.patientId),
        ),
      );
    } catch (err) {
      this.logger.warn(
        `Real-time re-index failed for patient ${payload.patientId}: ${String(err)}`,
      );
    }
  }

  /** Re-index a single patient's data for a specific doctor. */
  async reIndexSinglePatient(doctorId: string, patientId: string): Promise<void> {
    if (!this.isEnabled) return;

    const chunks = await this.buildPatientChunks(doctorId, patientId);
    if (chunks.length === 0) return;

    const docs: Parameters<ChromaService['upsertDocuments']>[1] = [];

    for (const chunk of chunks) {
      const embedding = await this.chromaService.embed(chunk.text);
      if (!embedding) continue;
      docs.push({
        id: chunk.id,
        document: chunk.text,
        embedding,
        metadata: { doctorId, patientId, type: chunk.type },
      });
    }

    if (docs.length > 0) {
      await this.chromaService.upsertDocuments(
        CHROMA_COLLECTION_DOCTOR_PATIENTS,
        docs,
      );
    }
  }

  // ─── Find doctors for a patient ───────────────────────────────────────────

  async getDoctorIdsForPatient(patientId: string): Promise<string[]> {
    const [assigned, fromCons, fromAppts] = await Promise.all([
      this.db
        .select({ doctorId: doctorPatient.doctorId })
        .from(doctorPatient)
        .where(
          and(
            eq(doctorPatient.patientId, patientId),
            eq(doctorPatient.status, 'active'),
          ),
        ),
      this.db
        .selectDistinct({ doctorId: consultation.doctorId })
        .from(consultation)
        .where(eq(consultation.patientId, patientId)),
      this.db
        .selectDistinct({ doctorId: appointment.doctorId })
        .from(appointment)
        .where(eq(appointment.patientId, patientId)),
    ]);

    const all = [
      ...assigned.map((r) => r.doctorId).filter(Boolean),
      ...fromCons.map((r) => r.doctorId).filter(Boolean),
      ...fromAppts.map((r) => r.doctorId).filter(Boolean),
    ] as string[];

    return [...new Set(all)];
  }

  // ─── Bulk index (all patients for a doctor) ───────────────────────────────

  private async indexAllPatientsForDoctor(doctorId: string): Promise<void> {
    const accessibleIds = await this.doctorTools.getAccessiblePatientIds(doctorId);
    if (accessibleIds.length === 0) return;

    this.logger.log(
      `Bulk indexing ${accessibleIds.length} patients for doctor ${doctorId}`,
    );

    for (const patientId of accessibleIds) {
      await this.reIndexSinglePatient(doctorId, patientId);
    }
  }

  // ─── Build text chunks for a patient ─────────────────────────────────────

  private async buildPatientChunks(
    doctorId: string,
    patientId: string,
  ): Promise<Array<{ id: string; type: string; text: string }>> {
    const chunks: Array<{ id: string; type: string; text: string }> = [];

    const sections = await Promise.allSettled([
      this.doctorTools.getPatientOverview(doctorId, patientId),
      this.doctorTools.getPatientConsultations(doctorId, patientId),
      this.doctorTools.getPatientMedications(doctorId, patientId),
      this.doctorTools.getPatientLabResults(doctorId, patientId),
      this.doctorTools.getPatientClinicalNotes(doctorId, patientId),
      this.doctorTools.getPatientDiagnoses(doctorId, patientId),
      this.doctorTools.getPatientAiAnalyses(doctorId, patientId),
      this.doctorTools.getPatientProcedures(doctorId, patientId),
    ]);

    const types = [
      'overview',
      'consultations',
      'medications',
      'labs',
      'notes',
      'diagnoses',
      'ai_analyses',
      'procedures',
    ] as const;

    const emptyPhrases = [
      'not in your panel',
      'no lab results recorded',
      'no medications recorded',
      'no completed consultations',
      'no clinical notes',
      'no AI analyses recorded',
      'no diagnoses recorded',
      'no procedures recorded',
      'no vital readings recorded',
      'profile unavailable',
    ];

    for (let i = 0; i < sections.length; i++) {
      const result = sections[i];
      if (result.status !== 'fulfilled') continue;
      const text = result.value.trim();
      if (!text) continue;
      if (emptyPhrases.some((p) => text.toLowerCase().includes(p))) continue;

      chunks.push({
        id: `dp_${doctorId.slice(0, 8)}_${patientId.slice(0, 8)}_${types[i]}`,
        type: types[i],
        text,
      });
    }

    return chunks;
  }
}
