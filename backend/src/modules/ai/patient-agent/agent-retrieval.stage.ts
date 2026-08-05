import { Inject, Injectable } from '@nestjs/common';

import {
  clinicSlotToIso,
  formatClinicDateTime,
} from '../../../common/clinic-time.util';
import {
  APPOINTMENT_READER,
  type IAppointmentReader,
} from '../../../shared/ports/appointment.port';
import {
  ChromaService,
  CHROMA_COLLECTION_CLINIC,
} from '../chroma/chroma.service';
import type { QueryUnderstandingResult, RetrievalHit } from './agent.types';

type DoctorRow = Awaited<ReturnType<IAppointmentReader['listDoctors']>>[number];
type PatientAppt = Awaited<
  ReturnType<IAppointmentReader['listPatientAppointments']>
>[number];

@Injectable()
export class AgentRetrievalStage {
  constructor(
    @Inject(APPOINTMENT_READER)
    private readonly appointmentReader: IAppointmentReader,
    private readonly chromaService: ChromaService,
  ) {}

  async run(params: {
    understanding: QueryUnderstandingResult;
    userId: number;
    todayStr: string;
  }): Promise<RetrievalHit[]> {
    const [doctors, appointments] = await Promise.all([
      this.safeListDoctors(),
      this.safeListAppointments(params.userId),
    ]);

    const keywordHits = await this.keywordSearch({
      understanding: params.understanding,
      doctors,
      appointments,
      todayStr: params.todayStr,
    });

    const vectorHits = await this.vectorSearch(params.understanding);

    return this.mergeAndRerank(keywordHits, vectorHits);
  }

  private async safeListDoctors(): Promise<DoctorRow[]> {
    try {
      return await this.appointmentReader.listDoctors();
    } catch {
      return [];
    }
  }

  private async safeListAppointments(userId: number): Promise<PatientAppt[]> {
    try {
      const rows = await this.appointmentReader.listPatientAppointments(userId);
      return rows.filter(
        (a) =>
          a.status !== 'cancelled' && new Date(a.scheduledAt) >= new Date(),
      );
    } catch {
      return [];
    }
  }

  private async keywordSearch(params: {
    understanding: QueryUnderstandingResult;
    doctors: DoctorRow[];
    appointments: PatientAppt[];
    todayStr: string;
  }): Promise<RetrievalHit[]> {
    const hits: RetrievalHit[] = [];
    const terms = this.buildSearchTerms(params.understanding);
    const targetDate = params.understanding.entities.find(
      (e) => e.type === 'date',
    )?.normalized;
    const targetDoctor = params.understanding.entities
      .find((e) => e.type === 'doctor_name')
      ?.normalized?.toLowerCase();
    const targetSpecialty = params.understanding.entities
      .find((e) => e.type === 'specialty')
      ?.normalized?.toLowerCase();

    for (const appt of params.appointments) {
      const cairo = formatClinicDateTime(appt.scheduledAt);
      const content = `${appt.confirmationCode} | ${cairo} | ${appt.clinician} | ${appt.visitType} | ${appt.status}`;
      const score = this.scoreText(content, terms, {
        boost: 0.15,
        entityBoost:
          (targetDoctor &&
            appt.clinician.toLowerCase().includes(targetDoctor)) ||
          params.understanding.intents.some((i) =>
            [
              'list_appointments',
              'cancel_appointment',
              'reschedule_appointment',
            ].includes(i.id),
          )
            ? 0.25
            : 0,
      });
      if (score > 0.2) {
        hits.push({
          id: appt.confirmationCode,
          collection: 'appointments',
          citation: `appointments#${appt.confirmationCode}`,
          content,
          score,
          metadata: {
            confirmationCode: appt.confirmationCode,
            scheduledAt: appt.scheduledAt,
            doctor: appt.clinician,
            visitType: appt.visitType,
            status: appt.status,
          },
        });
      }
    }

    for (const doc of params.doctors) {
      const profile = `${doc.name} | ${doc.title} | id:${doc.id}`;
      let profileScore = this.scoreText(profile, terms, {
        boost: 0.1,
        entityBoost:
          (targetDoctor && doc.name.toLowerCase().includes(targetDoctor)) ||
          (targetSpecialty && doc.title.toLowerCase().includes(targetSpecialty))
            ? 0.35
            : 0,
      });

      if (
        params.understanding.intents.some((i) => i.id === 'book_appointment') ||
        params.understanding.intents.some((i) => i.id === 'health_question')
      ) {
        profileScore += 0.05;
      }

      if (profileScore > 0.25) {
        hits.push({
          id: `doctor_${doc.id}`,
          collection: 'doctors',
          citation: `doctors#${doc.id}`,
          content: profile,
          score: profileScore,
          metadata: {
            doctorId: doc.id,
            doctorName: doc.name,
            specialty: doc.title,
          },
        });
      }

      try {
        const avail = await this.appointmentReader.getDoctorAvailability(
          doc.id,
          params.todayStr,
          7,
        );

        for (const day of avail.days.filter((d) => !d.disabled)) {
          if (targetDate && day.fullDate !== targetDate) continue;

          const slots = (avail.timeSlotsByDate[day.fullDate] ?? [])
            .filter((s) => s.available)
            .slice(0, 4);

          for (const slot of slots) {
            const iso = clinicSlotToIso(day.fullDate, slot.time);
            const content = `${doc.name} | ${day.fullDate} ${slot.time} → ${iso} | ${doc.title}`;
            const score = this.scoreText(content, terms, {
              boost: 0.2,
              entityBoost:
                (targetDoctor &&
                  doc.name.toLowerCase().includes(targetDoctor)) ||
                (targetSpecialty &&
                  doc.title.toLowerCase().includes(targetSpecialty))
                  ? 0.3
                  : targetDate && day.fullDate === targetDate
                    ? 0.2
                    : 0,
            });
            if (score > 0.35) {
              hits.push({
                id: `slot_${doc.id}_${day.fullDate}_${slot.time}`,
                collection: 'schedule',
                citation: `schedule#${doc.id}#${day.fullDate}#${slot.time}`,
                content,
                score,
                metadata: {
                  doctorId: doc.id,
                  doctorName: doc.name,
                  date: day.fullDate,
                  time: slot.time,
                  scheduledAt: iso,
                  available: 'true',
                },
              });
            }
          }
        }
      } catch {
        // skip doctor schedule errors
      }
    }

    return hits;
  }

  private async vectorSearch(
    understanding: QueryUnderstandingResult,
  ): Promise<RetrievalHit[]> {
    if (!this.chromaService.isSearchEnabled) return [];

    const query =
      understanding.reformulatedQuery ||
      understanding.normalizedQuery ||
      understanding.expandedTerms.join(' ');

    const embedding = await this.chromaService.embed(query);
    if (!embedding) return [];

    const docs = await this.chromaService.queryDocuments(
      CHROMA_COLLECTION_CLINIC,
      embedding,
      6,
    );

    return docs.map((d) => ({
      id: d.id,
      collection: 'clinic_vector' as const,
      citation: `clinic_vector#${d.id}`,
      content: d.document,
      score: Math.max(0, 1 - (d.distance ?? 1)),
      metadata: Object.fromEntries(
        Object.entries(d.metadata).map(([k, v]) => [k, String(v)]),
      ),
    }));
  }

  private mergeAndRerank(
    keywordHits: RetrievalHit[],
    vectorHits: RetrievalHit[],
  ): RetrievalHit[] {
    const byKey = new Map<string, RetrievalHit>();

    for (const hit of [...keywordHits, ...vectorHits]) {
      const key = `${hit.collection}:${hit.id}`;
      const existing = byKey.get(key);
      if (!existing || hit.score > existing.score) {
        byKey.set(key, {
          ...hit,
          score: existing
            ? Math.min(1, existing.score + hit.score * 0.35)
            : hit.score,
        });
      }
    }

    return [...byKey.values()].sort((a, b) => b.score - a.score).slice(0, 16);
  }

  private buildSearchTerms(understanding: QueryUnderstandingResult): string[] {
    const set = new Set<string>();
    for (const t of understanding.expandedTerms) {
      if (t.length > 1) set.add(t.toLowerCase());
    }
    for (const e of understanding.entities) {
      set.add(e.normalized.toLowerCase());
      if (e.raw.length > 1) set.add(e.raw.toLowerCase());
    }
    const query =
      understanding.reformulatedQuery || understanding.normalizedQuery;
    for (const w of query.toLowerCase().split(/[\s,.;:!?،]+/)) {
      if (w.length > 1) set.add(w);
    }
    return [...set];
  }

  private scoreText(
    text: string,
    terms: string[],
    opts: { boost: number; entityBoost: number },
  ): number {
    const lower = text.toLowerCase();
    let matches = 0;
    for (const term of terms) {
      if (lower.includes(term)) matches++;
    }
    if (matches === 0 && opts.entityBoost === 0) return 0;
    const ratio = terms.length > 0 ? matches / terms.length : 0;
    return Math.min(1, ratio + opts.boost + opts.entityBoost);
  }
}
