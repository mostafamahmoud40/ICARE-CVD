import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AppointmentService } from '../../appointment/appointment.service';
import {
  clinicSlotToIso,
  formatClinicDateTime,
  todayClinicDateStr,
} from '../../../common/clinic-time.util';
import { ChromaService, CHROMA_COLLECTION_CLINIC, CHROMA_COLLECTION_APPOINTMENTS } from './chroma.service';
import { EmbeddingService } from '../embedding/embedding.service';

/**
 * Indexes clinic data into ChromaDB when an embedding provider is enabled (BGE-M3 or Cohere).
 */
@Injectable()
export class ClinicIndexerService implements OnModuleInit {
  private readonly logger = new Logger(ClinicIndexerService.name);

  constructor(
    private readonly chromaService: ChromaService,
    private readonly appointmentService: AppointmentService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  // ─── Startup + periodic full re-index ────────────────────────────────────

  async onModuleInit() {
    if (!this.embeddingService.isEnabled()) return;
    // Initial index after a short delay (let ChromaDB finish connecting)
    setTimeout(() => void this.indexAllClinicData(), 5_000);

    // Re-index every 30 minutes to stay fresh
    setInterval(() => void this.indexAllClinicData(), 30 * 60 * 1_000);
  }

  async indexAllClinicData() {
    if (!this.embeddingService.isEnabled()) return;
    if (!this.chromaService.isReady) return;
    try {
      await this.indexDoctorsAndSchedules();
      this.logger.log(
        `Clinic context indexed into ChromaDB (${this.embeddingService.getProvider()}, ${this.embeddingService.getDimension()}d)`,
      );
    } catch (err) {
      this.logger.warn(`Clinic index failed: ${String(err)}`);
    }
  }

  // ─── Doctors + schedules ──────────────────────────────────────────────────

  async indexDoctorsAndSchedules(): Promise<void> {
    const today = todayClinicDateStr();
    let doctors: Awaited<ReturnType<AppointmentService['listDoctors']>> = [];
    try {
      doctors = await this.appointmentService.listDoctors();
    } catch {
      return;
    }

    const docs: Parameters<ChromaService['upsertDocuments']>[1] = [];

    for (const doc of doctors) {
      // ── Doctor profile document ──────────────────────────────────────────
      const profileText = [
        `Doctor: ${doc.name}`,
        `Specialty: ${doc.title}`,
        `doctorId: ${doc.id}`,
        `Available for appointments.`,
      ].join('\n');

      const profileEmbedding = await this.chromaService.embed(profileText);
      if (profileEmbedding) {
        docs.push({
          id: `doctor_profile_${doc.id}`,
          document: profileText,
          embedding: profileEmbedding,
          metadata: {
            type: 'doctor_profile',
            doctorId: doc.id,
            doctorName: doc.name,
          },
        });
      }

      // ── Schedule documents (one per day with available slots) ─────────────
      try {
        const avail = await this.appointmentService.getDoctorAvailability(
          doc.id,
          today,
          7,
        );

        // Blocked dates
        const blocked = avail.days
          .filter((d) => d.disabled)
          .map((d) => d.fullDate);

        if (blocked.length > 0) {
          const blockedText = [
            `Doctor ${doc.name} (${doc.title}) is unavailable / fully booked on these dates:`,
            blocked.join(', '),
          ].join('\n');
          const blockedEmbedding = await this.chromaService.embed(blockedText);
          if (blockedEmbedding) {
            docs.push({
              id: `doctor_blocked_${doc.id}`,
              document: blockedText,
              embedding: blockedEmbedding,
              metadata: {
                type: 'blocked_dates',
                doctorId: doc.id,
                doctorName: doc.name,
              },
            });
          }
        }

        // Available days with slots
        for (const day of avail.days.filter((d) => !d.disabled)) {
          const rawSlots = avail.timeSlotsByDate[day.fullDate] ?? [];
          const freeSlots = rawSlots.filter((s) => s.available);
          if (freeSlots.length === 0) continue;

          const slotLines = freeSlots.map(
            (s) =>
              `  ${s.time} Cairo → scheduledAt: ${clinicSlotToIso(day.fullDate, s.time)}`,
          );

          const schedText = [
            `Doctor ${doc.name} (${doc.title}) — available appointment slots:`,
            `Date: ${day.fullDate} (${day.day})`,
            `doctorId: ${doc.id}`,
            'Slots:',
            ...slotLines,
          ].join('\n');

          const schedEmbedding = await this.chromaService.embed(schedText);
          if (schedEmbedding) {
            docs.push({
              id: `doctor_schedule_${doc.id}_${day.fullDate}`,
              document: schedText,
              embedding: schedEmbedding,
              metadata: {
                type: 'schedule',
                doctorId: doc.id,
                doctorName: doc.name,
                date: day.fullDate,
              },
            });
          }
        }
      } catch {
        // individual doctor schedule failure — skip
      }
    }

    if (docs.length > 0) {
      await this.chromaService.upsertDocuments(CHROMA_COLLECTION_CLINIC, docs);
    }
  }

  // ─── Patient appointments ──────────────────────────────────────────────────

  async indexPatientAppointments(userId: number): Promise<void> {
    if (!this.embeddingService.isEnabled()) return;
    if (!this.chromaService.isReady) return;
    try {
      const appts = await this.appointmentService.listPatientAppointments(userId);
      const upcoming = appts.filter(
        (a) => a.status !== 'cancelled' && new Date(a.scheduledAt) >= new Date(),
      );

      if (upcoming.length === 0) {
        // Remove stale entries for this patient
        await this.chromaService.deleteDocuments(
          CHROMA_COLLECTION_APPOINTMENTS,
          [`patient_appts_${userId}`],
        );
        return;
      }

      const text = [
        `Patient (userId: ${userId}) upcoming appointments:`,
        'Use confirmationCode in cancel/reschedule tools. Times shown in Cairo local time.',
        ...upcoming.map(
          (a) =>
            `  ${a.confirmationCode} | ${formatClinicDateTime(a.scheduledAt)} Cairo | scheduledAt: ${a.scheduledAt} | ${a.clinician} | ${a.visitType} | ${a.status}`,
        ),
      ].join('\n');

      const embedding = await this.chromaService.embed(text);
      if (!embedding) return;

      await this.chromaService.upsertDocuments(CHROMA_COLLECTION_APPOINTMENTS, [
        {
          id: `patient_appts_${userId}`,
          document: text,
          embedding,
          metadata: { type: 'patient_appointments', userId },
        },
      ]);
    } catch {
      // non-critical
    }
  }
}
