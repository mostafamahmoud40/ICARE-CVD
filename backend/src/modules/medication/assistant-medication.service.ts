import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, gte, inArray } from 'drizzle-orm';

import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import {
  doseLog,
  medication,
  medicationAdherenceFlag,
  medicationAiInsightDismissal,
  medicationContactLog,
  medicationEscalation,
  medicationRefill,
  patient,
  user,
} from '../../database/schema';
import { findPatientByIdentifier } from '../../shared/patient/patient-identifier';
import { AvatarUrlResolver } from '../../shared/storage/avatar-url.resolver';
import { compute7DayAdherence } from './medication-adherence.util';
import type {
  CreateMedicationContactDto,
  CreateMedicationEscalationDto,
  CreateMedicationFlagDto,
} from './dto/assistant-medication.dto';

type RiskTier = 'low' | 'medium' | 'high';

function calcAge(dateOfBirth: Date | string | null | undefined): number {
  if (!dateOfBirth) return 0;
  const dob = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

function toDateOnly(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function mapRiskTier(
  overallPct: number,
  hasPoorCompliance: boolean,
): RiskTier {
  if (hasPoorCompliance || overallPct < 65) return 'high';
  if (overallPct < 85) return 'medium';
  return 'low';
}

@Injectable()
export class AssistantMedicationService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly avatarUrlResolver: AvatarUrlResolver,
  ) {}

  async listMedicationProfiles() {
    const patientRows = await this.db
      .select({
        id: patient.id,
        patientNumber: patient.patientNumber,
        userId: patient.userId,
        dateOfBirth: patient.dateOfBirth,
        avatarUrl: patient.avatarUrl,
        fullName: user.name,
        phone: user.phone,
      })
      .from(patient)
      .innerJoin(user, eq(patient.userId, user.id))
      .orderBy(user.name);

    if (patientRows.length === 0) return [];

    const patientIds = patientRows.map((row) => row.id);
    const userIds = patientRows.map((row) => row.userId);

    const medicationRows = await this.db
      .select()
      .from(medication)
      .where(inArray(medication.userId, userIds))
      .orderBy(desc(medication.createdAt));

    const activeMedicationRows = medicationRows.filter(
      (med) => med.status === 'active',
    );

    const patientsWithMeds = new Set<string>();
    for (const med of activeMedicationRows) {
      const owner = patientRows.find((p) => p.userId === med.userId);
      if (owner) patientsWithMeds.add(owner.id);
    }

    const relevantPatients = patientRows.filter((p) =>
      patientsWithMeds.has(p.id),
    );
    if (relevantPatients.length === 0) return [];

    const relevantPatientIds = relevantPatients.map((p) => p.id);
    const medIds = medicationRows.map((m) => m.id);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [doseLogs, refills, flags, escalations, contacts, dismissals] =
      await Promise.all([
        medIds.length > 0
          ? this.db
              .select({
                medicationId: doseLog.medicationId,
                takenAt: doseLog.takenAt,
                skipped: doseLog.skipped,
              })
              .from(doseLog)
              .where(
                and(
                  inArray(doseLog.medicationId, medIds),
                  gte(doseLog.takenAt, sevenDaysAgo),
                ),
              )
          : Promise.resolve([]),
        medIds.length > 0
          ? this.db
              .select()
              .from(medicationRefill)
              .where(inArray(medicationRefill.medicationId, medIds))
          : Promise.resolve([]),
        this.db
          .select()
          .from(medicationAdherenceFlag)
          .where(inArray(medicationAdherenceFlag.patientId, relevantPatientIds))
          .orderBy(desc(medicationAdherenceFlag.createdAt)),
        this.db
          .select()
          .from(medicationEscalation)
          .where(inArray(medicationEscalation.patientId, relevantPatientIds))
          .orderBy(desc(medicationEscalation.createdAt)),
        this.db
          .select()
          .from(medicationContactLog)
          .where(inArray(medicationContactLog.patientId, relevantPatientIds))
          .orderBy(desc(medicationContactLog.createdAt)),
        this.db
          .select()
          .from(medicationAiInsightDismissal)
          .where(
            inArray(medicationAiInsightDismissal.patientId, relevantPatientIds),
          ),
      ]);

    const doseLogsByMed = new Map<string, typeof doseLogs>();
    for (const log of doseLogs) {
      const bucket = doseLogsByMed.get(log.medicationId) ?? [];
      bucket.push(log);
      doseLogsByMed.set(log.medicationId, bucket);
    }

    const refillByMed = new Map(
      refills.map((r) => [r.medicationId, r] as const),
    );

    return Promise.all(
      relevantPatients.map(async (p) =>
        this.buildProfile({
          patientRow: p,
          medications: activeMedicationRows.filter((m) => m.userId === p.userId),
          allMedications: medicationRows.filter((m) => m.userId === p.userId),
          doseLogsByMed,
          refillByMed,
          flags: flags.filter((f) => f.patientId === p.id),
          escalations: escalations.filter((e) => e.patientId === p.id),
          contacts: contacts.filter((c) => c.patientId === p.id),
          dismissedKeys: new Set(
            dismissals
              .filter((d) => d.patientId === p.id)
              .map((d) => d.insightKey),
          ),
        }),
      ),
    );
  }

  async getMedicationProfile(patientIdentifier: string) {
    const patientRow = await findPatientByIdentifier(this.db, patientIdentifier);
    const profiles = await this.listMedicationProfiles();
    const profile = profiles.find((p) => p.id === patientRow.id);
    if (!profile) {
      throw new NotFoundException('No active medications found for this patient');
    }
    return profile;
  }

  async createFlag(assistantUserId: number, dto: CreateMedicationFlagDto) {
    const patientRow = await findPatientByIdentifier(this.db, dto.patientId);
    const med = await this.db.query.medication.findFirst({
      where: eq(medication.id, dto.medicationId),
    });
    if (!med || med.userId !== patientRow.userId) {
      throw new NotFoundException('Medication not found for patient');
    }

    const [created] = await this.db
      .insert(medicationAdherenceFlag)
      .values({
        patientId: patientRow.id,
        medicationId: dto.medicationId,
        reason: dto.reason.trim(),
        severity: dto.severity,
        createdByUserId: assistantUserId,
      })
      .returning();

    return {
      id: created.id,
      medicationLineId: created.medicationId ?? dto.medicationId,
      patientId: created.patientId,
      reason: created.reason,
      severity: created.severity,
      createdAt: toIso(created.createdAt) ?? new Date().toISOString(),
      createdByLabel: 'Assistant',
      status: created.status as 'open' | 'resolved',
    };
  }

  async resolveFlag(
    assistantUserId: number,
    flagId: string,
    resolutionNote?: string,
  ) {
    void assistantUserId;
    const existing = await this.db.query.medicationAdherenceFlag.findFirst({
      where: eq(medicationAdherenceFlag.id, flagId),
    });
    if (!existing) throw new NotFoundException('Flag not found');

    await this.db
      .update(medicationAdherenceFlag)
      .set({
        status: 'resolved',
        resolvedAt: new Date(),
        resolutionNote: resolutionNote?.trim() || 'Cleared from assistant workflow.',
      })
      .where(eq(medicationAdherenceFlag.id, flagId));

    return { success: true };
  }

  async updateInstructions(medicationId: string, instructions: string) {
    const existing = await this.db.query.medication.findFirst({
      where: eq(medication.id, medicationId),
    });
    if (!existing) throw new NotFoundException('Medication not found');

    const [updated] = await this.db
      .update(medication)
      .set({
        instructions: instructions.trim(),
        updatedAt: new Date(),
      })
      .where(eq(medication.id, medicationId))
      .returning();

    return updated;
  }

  async createContactLog(
    assistantUserId: number,
    dto: CreateMedicationContactDto,
  ) {
    const patientRow = await findPatientByIdentifier(this.db, dto.patientId);

    const [created] = await this.db
      .insert(medicationContactLog)
      .values({
        patientId: patientRow.id,
        channel: dto.channel,
        status: 'queued',
        summary: dto.summary.trim(),
        messagePreview: dto.messagePreview.trim(),
        createdByUserId: assistantUserId,
      })
      .returning();

    return {
      id: created.id,
      patientId: created.patientId,
      channel: created.channel,
      status: created.status,
      summary: created.summary,
      messagePreview: created.messagePreview,
      createdAt: toIso(created.createdAt) ?? new Date().toISOString(),
      createdByLabel: 'Assistant',
    };
  }

  async createEscalation(
    assistantUserId: number,
    dto: CreateMedicationEscalationDto,
  ) {
    const patientRow = await findPatientByIdentifier(this.db, dto.patientId);

    if (dto.medicationId) {
      const med = await this.db.query.medication.findFirst({
        where: eq(medication.id, dto.medicationId),
      });
      if (!med || med.userId !== patientRow.userId) {
        throw new NotFoundException('Medication not found for patient');
      }
    }

    const [created] = await this.db
      .insert(medicationEscalation)
      .values({
        patientId: patientRow.id,
        medicationId: dto.medicationId ?? null,
        priority: dto.priority,
        reason: dto.reason.trim(),
        note: dto.note.trim(),
        createdByUserId: assistantUserId,
      })
      .returning();

    return {
      id: created.id,
      patientId: created.patientId,
      medicationLineId: created.medicationId,
      priority: created.priority,
      reason: created.reason,
      note: created.note,
      status: created.status as 'waiting_review' | 'reviewed',
      createdAt: toIso(created.createdAt) ?? new Date().toISOString(),
      createdByLabel: 'Assistant',
    };
  }

  async dismissInsight(
    assistantUserId: number,
    patientIdentifier: string,
    insightKey: string,
  ) {
    const patientRow = await findPatientByIdentifier(this.db, patientIdentifier);

    await this.db
      .insert(medicationAiInsightDismissal)
      .values({
        patientId: patientRow.id,
        insightKey,
        dismissedByUserId: assistantUserId,
      })
      .onConflictDoNothing({
        target: [
          medicationAiInsightDismissal.patientId,
          medicationAiInsightDismissal.insightKey,
        ],
      });

    return { success: true };
  }

  private async buildProfile(input: {
    patientRow: {
      id: string;
      patientNumber: string;
      dateOfBirth: Date | string | null;
      avatarUrl: string | null;
      fullName: string;
      phone: string | null;
    };
    medications: (typeof medication.$inferSelect)[];
    allMedications: (typeof medication.$inferSelect)[];
    doseLogsByMed: Map<
      string,
      { medicationId: string; takenAt: Date; skipped: boolean }[]
    >;
    refillByMed: Map<string, typeof medicationRefill.$inferSelect>;
    flags: (typeof medicationAdherenceFlag.$inferSelect)[];
    escalations: (typeof medicationEscalation.$inferSelect)[];
    contacts: (typeof medicationContactLog.$inferSelect)[];
    dismissedKeys: Set<string>;
  }) {
    const { patientRow, medications, allMedications, doseLogsByMed, refillByMed } = input;

    const mapMedicationLine = (med: (typeof medication.$inferSelect)) => {
      const logs = doseLogsByMed.get(med.id) ?? [];
      const refill = refillByMed.get(med.id);
      const adherence = compute7DayAdherence({
        frequency: med.frequency,
        timeOfDay: med.timeOfDay ?? [],
        startDate: med.startDate ? String(med.startDate) : null,
        doseLogs: logs,
      });

      return {
        id: med.id,
        name: med.name,
        strength: med.dose,
        dosageInstructions: med.instructions?.trim() || `${med.dose} · ${med.frequency}`,
        frequencyLabel: med.frequency,
        adherencePct7d: adherence.adherencePct7d,
        missedLast7d: adherence.missedLast7d,
        nextRefillDue: refill?.nextRefillDue
          ? toDateOnly(refill.nextRefillDue)
          : null,
        adherenceHistory7d: adherence.adherenceHistory7d,
      };
    };

    const medicationLines = medications.map(mapMedicationLine);
    const pastMedications = allMedications
      .filter((med) => med.status !== 'active')
      .map((med) => ({
        id: med.id,
        name: med.name,
        strength: med.dose,
        dosageInstructions:
          med.instructions?.trim() || `${med.dose} · ${med.frequency}`,
        statusLabel:
          med.status === 'discontinued' ? 'Discontinued' : 'Paused',
      }));

    const activePcts = medicationLines.map((m) => m.adherencePct7d);
    const overallAdherencePct =
      activePcts.length > 0
        ? Math.round(
            activePcts.reduce((sum, pct) => sum + pct, 0) / activePcts.length,
          )
        : 100;

    const hasPoorCompliance = medications.some((m) => m.compliance === 'poor');
    const riskTier = mapRiskTier(overallAdherencePct, hasPoorCompliance);

    const aiInsights = this.buildAiInsights(
      patientRow.id,
      medicationLines,
      input.dismissedKeys,
    );

    return {
      id: patientRow.id,
      patientNumber: patientRow.patientNumber,
      fullName: patientRow.fullName,
      age: calcAge(patientRow.dateOfBirth),
      phone: patientRow.phone,
      avatarUrl: await this.avatarUrlResolver.resolve(patientRow.avatarUrl),
      riskTier,
      overallAdherencePct,
      medications: medicationLines,
      pastMedications,
      flags: input.flags.map((flag) => ({
        id: flag.id,
        medicationLineId: flag.medicationId ?? '',
        patientId: flag.patientId,
        reason: flag.reason,
        severity: flag.severity as 'info' | 'watch' | 'critical',
        createdAt: toIso(flag.createdAt) ?? new Date().toISOString(),
        createdByLabel: 'Assistant',
        status: flag.status as 'open' | 'resolved',
        resolvedAt: toIso(flag.resolvedAt),
        resolutionNote: flag.resolutionNote,
      })),
      aiInsights,
      contactHistory: input.contacts.map((event) => ({
        id: event.id,
        patientId: event.patientId,
        channel: event.channel as 'sms' | 'push' | 'call',
        status: event.status as 'queued' | 'delivered' | 'failed' | 'replied',
        summary: event.summary,
        messagePreview: event.messagePreview,
        createdAt: toIso(event.createdAt) ?? new Date().toISOString(),
        createdByLabel: 'Assistant',
      })),
      escalations: input.escalations.map((esc) => ({
        id: esc.id,
        patientId: esc.patientId,
        medicationLineId: esc.medicationId,
        priority: esc.priority as 'routine' | 'urgent' | 'critical',
        reason: esc.reason,
        note: esc.note,
        status: esc.status as 'waiting_review' | 'reviewed',
        createdAt: toIso(esc.createdAt) ?? new Date().toISOString(),
        createdByLabel: 'Assistant',
      })),
    };
  }

  private buildAiInsights(
    patientId: string,
    meds: {
      id: string;
      name: string;
      strength: string;
      adherencePct7d: number;
      missedLast7d: number;
      nextRefillDue: string | null;
    }[],
    dismissedKeys: Set<string>,
  ) {
    const insights: {
      id: string;
      patientId: string;
      kind: 'adherence' | 'interaction' | 'refill' | 'education';
      title: string;
      detail: string;
      confidencePct: number;
    }[] = [];

    for (const med of meds) {
      if (med.adherencePct7d < 65) {
        const key = `adherence-low-${med.id}`;
        if (!dismissedKeys.has(key)) {
          insights.push({
            id: key,
            patientId,
            kind: 'adherence',
            title: 'Low 7-day adherence',
            detail: `${med.name} ${med.strength} is at ${med.adherencePct7d}% adherence with ${med.missedLast7d} missed dose(s) in the last week.`,
            confidencePct: 85,
          });
        }
      } else if (med.missedLast7d >= 2) {
        const key = `adherence-missed-${med.id}`;
        if (!dismissedKeys.has(key)) {
          insights.push({
            id: key,
            patientId,
            kind: 'adherence',
            title: 'Repeated missed doses',
            detail: `${med.name} has ${med.missedLast7d} missed doses recorded in the last 7 days.`,
            confidencePct: 78,
          });
        }
      }

      if (!med.nextRefillDue) {
        const key = `refill-missing-${med.id}`;
        if (!dismissedKeys.has(key)) {
          insights.push({
            id: key,
            patientId,
            kind: 'refill',
            title: 'Missing refill date',
            detail: `No refill date is recorded for ${med.name}.`,
            confidencePct: 72,
          });
        }
      } else {
        const dueIn = Math.ceil(
          (new Date(`${med.nextRefillDue}T00:00:00`).getTime() - Date.now()) /
            86_400_000,
        );
        if (dueIn <= 7) {
          const key = `refill-due-${med.id}`;
          if (!dismissedKeys.has(key)) {
            insights.push({
              id: key,
              patientId,
              kind: 'refill',
              title: dueIn < 0 ? 'Refill overdue' : 'Refill due soon',
              detail:
                dueIn < 0
                  ? `${med.name} refill is overdue by ${Math.abs(dueIn)} day(s).`
                  : dueIn === 0
                    ? `${med.name} refill is due today.`
                    : `${med.name} refill is due in ${dueIn} day(s).`,
              confidencePct: 80,
            });
          }
        }
      }
    }

    return insights;
  }
}
