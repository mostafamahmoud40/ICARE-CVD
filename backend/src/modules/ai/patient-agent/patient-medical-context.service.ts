import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';

import { DRIZZLE } from '../../../database/drizzle.provider';
import type { Database } from '../../../database/drizzle.provider';
import { jsonToText } from '../../../shared/format-unknown';
import {
  allergy,
  consultation,
  consultationDiagnosis,
  consultationPrescription,
  diagnosis,
  familyHistory,
  labResult,
  medication,
  patient,
  patientClinicalNote,
  patientHistory,
  user,
  doctor,
  vitalReading,
} from '../../../database/schema';

@Injectable()
export class PatientMedicalContextService {
  private readonly logger = new Logger(PatientMedicalContextService.name);

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async build(userId: number): Promise<string> {
    try {
      const patientRow = await this.db.query.patient.findFirst({
        where: eq(patient.userId, userId),
      });
      if (!patientRow) return '';

      const userRow = await this.db.query.user.findFirst({
        where: eq(user.id, userId),
      });

      const [
        historyRow,
        allergies,
        familyHistories,
        medications,
        consultations,
        labResults,
        vitals,
        clinicalNotes,
      ] = await Promise.all([
        this.db.query.patientHistory.findFirst({
          where: eq(patientHistory.userId, userId),
        }),
        this.db.query.allergy.findMany({
          where: eq(allergy.userId, userId),
        }),
        this.db.query.familyHistory.findMany({
          where: eq(familyHistory.userId, userId),
        }),
        this.db
          .select({
            name: medication.name,
            dose: medication.dose,
            frequency: medication.frequency,
            type: medication.type,
            status: medication.status,
            compliance: medication.compliance,
            startDate: medication.startDate,
            endDate: medication.endDate,
            instructions: medication.instructions,
            doctorName: user.name,
          })
          .from(medication)
          .leftJoin(doctor, eq(medication.prescribedBy, doctor.id))
          .leftJoin(user, eq(doctor.userId, user.id))
          .where(eq(medication.userId, userId))
          .orderBy(desc(medication.createdAt)),
        this.db
          .select({
            id: consultation.id,
            visitType: consultation.visitType,
            chiefComplaint: consultation.chiefComplaint,
            historyOfPresentIllness: consultation.historyOfPresentIllness,
            plan: consultation.plan,
            notes: consultation.notes,
            followUpInstructions: consultation.followUpInstructions,
            completedAt: consultation.completedAt,
            startedAt: consultation.startedAt,
            doctorName: user.name,
            doctorSpecialty: doctor.specialty,
          })
          .from(consultation)
          .innerJoin(doctor, eq(consultation.doctorId, doctor.id))
          .innerJoin(user, eq(doctor.userId, user.id))
          .where(
            and(
              eq(consultation.patientId, patientRow.id),
              eq(consultation.status, 'completed'),
            ),
          )
          .orderBy(desc(consultation.completedAt))
          .limit(6),
        this.db
          .select({
            testName: labResult.testName,
            value: labResult.value,
            unit: labResult.unit,
            referenceRange: labResult.referenceRange,
            status: labResult.status,
            resultAt: labResult.resultAt,
          })
          .from(labResult)
          .where(eq(labResult.patientId, patientRow.id))
          .orderBy(desc(labResult.resultAt))
          .limit(30),
        this.db
          .select({
            date: vitalReading.date,
            time: vitalReading.time,
            source: vitalReading.source,
            systolicBp: vitalReading.systolicBp,
            diastolicBp: vitalReading.diastolicBp,
            heartRate: vitalReading.heartRate,
            oxygenSaturation: vitalReading.oxygenSaturation,
            weight: vitalReading.weight,
            temperature: vitalReading.temperature,
            bloodSugar: vitalReading.bloodSugar,
            notes: vitalReading.notes,
          })
          .from(vitalReading)
          .where(eq(vitalReading.patientId, patientRow.id))
          .orderBy(desc(vitalReading.createdAt))
          .limit(8),
        this.db
          .select({
            body: patientClinicalNote.body,
            createdAt: patientClinicalNote.createdAt,
          })
          .from(patientClinicalNote)
          .where(eq(patientClinicalNote.patientId, patientRow.id))
          .orderBy(desc(patientClinicalNote.createdAt))
          .limit(10),
      ]);

      // Fetch diagnoses + prescriptions for the fetched consultations in two batch queries
      const consultationIds = consultations.map((c) => c.id);
      const [diagnosesRows, prescriptionsRows] =
        consultationIds.length > 0
          ? await Promise.all([
              this.db
                .select({
                  consultationId: consultationDiagnosis.consultationId,
                  icdCode: diagnosis.icdCode,
                  description: diagnosis.description,
                  type: consultationDiagnosis.type,
                  severity: diagnosis.severity,
                  status: diagnosis.status,
                  chronicFlag: diagnosis.chronicFlag,
                })
                .from(consultationDiagnosis)
                .innerJoin(
                  diagnosis,
                  eq(consultationDiagnosis.diagnosisId, diagnosis.id),
                )
                .where(
                  inArray(
                    consultationDiagnosis.consultationId,
                    consultationIds,
                  ),
                ),
              this.db
                .select({
                  consultationId: consultationPrescription.consultationId,
                  name: medication.name,
                  dose: medication.dose,
                  frequency: medication.frequency,
                  isNew: consultationPrescription.isNew,
                })
                .from(consultationPrescription)
                .innerJoin(
                  medication,
                  eq(consultationPrescription.medicationId, medication.id),
                )
                .where(
                  inArray(
                    consultationPrescription.consultationId,
                    consultationIds,
                  ),
                ),
            ])
          : [[], []];

      const sections: string[] = [
        `=== PATIENT MEDICAL RECORD (live — this patient only) ===`,
      ];

      // ── Profile ──────────────────────────────────────────────────────────
      if (patientRow && userRow) {
        const age = this.computeAge(patientRow.dateOfBirth);
        const parts = [
          `Name: ${userRow.name}`,
          `Age: ${age}`,
          `Gender: ${patientRow.gender}`,
          patientRow.bloodType ? `Blood type: ${patientRow.bloodType}` : null,
          patientRow.heightCm ? `Height: ${patientRow.heightCm} cm` : null,
          patientRow.weightKg ? `Weight: ${patientRow.weightKg} kg` : null,
          patientRow.bmi ? `BMI: ${patientRow.bmi}` : null,
          patientRow.smokingStatus
            ? `Smoking: ${patientRow.smokingStatus}`
            : null,
          patientRow.alcoholConsumption
            ? `Alcohol: ${patientRow.alcoholConsumption}`
            : null,
          patientRow.exerciseFrequency
            ? `Exercise: ${patientRow.exerciseFrequency}`
            : null,
          patientRow.dietaryHabits ? `Diet: ${patientRow.dietaryHabits}` : null,
          `Risk level: ${patientRow.riskLevel}`,
        ]
          .filter(Boolean)
          .join(' | ');
        sections.push(`\n## Profile\n${parts}`);
        if (patientRow.aiRegistrationSummary?.trim()) {
          sections.push(
            `AI Registration Summary: ${patientRow.aiRegistrationSummary.trim()}`,
          );
        }
      }

      // ── Medical History ───────────────────────────────────────────────────
      if (historyRow) {
        const lines: string[] = ['\n## Medical History'];
        if (historyRow.chiefComplaint) {
          const txt =
            historyRow.chiefComplaint === 'other' &&
            historyRow.chiefComplaintOtherText
              ? historyRow.chiefComplaintOtherText
              : historyRow.chiefComplaint;
          lines.push(`Chief complaint: ${txt}`);
        }
        if (historyRow.hpiData) {
          lines.push(`HPI: ${jsonToText(historyRow.hpiData)}`);
        }
        if (historyRow.noCardiacHistory) {
          lines.push('Past cardiac history: none');
        } else if (historyRow.pastCardiacHistory) {
          lines.push(
            `Past cardiac history: ${jsonToText(historyRow.pastCardiacHistory)}`,
          );
        }
        if (historyRow.noNonCardiacHistory) {
          lines.push('Past non-cardiac history: none');
        } else if (historyRow.pastNonCardiacHistory) {
          lines.push(
            `Past non-cardiac history: ${jsonToText(historyRow.pastNonCardiacHistory)}`,
          );
        }
        if (historyRow.cardiovascularRiskFactors) {
          lines.push(
            `CVD risk factors: ${jsonToText(historyRow.cardiovascularRiskFactors)}`,
          );
        }
        if (historyRow.medicalHistoryNotes?.trim()) {
          lines.push(`Medical notes: ${historyRow.medicalHistoryNotes.trim()}`);
        }
        if (lines.length > 1) sections.push(lines.join('\n'));
      }

      // ── Allergies ─────────────────────────────────────────────────────────
      if (allergies.length > 0) {
        const lines = ['\n## Allergies'];
        for (const a of allergies) {
          const reaction = a.reaction ? ` → reaction: ${a.reaction}` : '';
          lines.push(`- ${a.category}: ${a.allergen}${reaction}`);
        }
        sections.push(lines.join('\n'));
      } else {
        sections.push('\n## Allergies\nNone recorded');
      }

      // ── Family History ────────────────────────────────────────────────────
      if (familyHistories.length > 0) {
        const lines = ['\n## Family History'];
        for (const f of familyHistories) {
          const detail = f.details ? ` (${f.details})` : '';
          lines.push(`- ${f.relationship}: ${f.condition}${detail}`);
        }
        sections.push(lines.join('\n'));
      }

      // ── Medications ───────────────────────────────────────────────────────
      if (medications.length > 0) {
        const active = medications.filter((m) => m.status === 'active');
        const other = medications.filter((m) => m.status !== 'active');
        const lines = ['\n## Medications'];
        if (active.length > 0) {
          lines.push('Active:');
          for (const m of active) {
            const parts = [`${m.name} ${m.dose} ${m.frequency}`];
            if (m.compliance) parts.push(`compliance: ${m.compliance}`);
            if (m.startDate)
              parts.push(`from: ${this.formatDate(m.startDate)}`);
            if (m.endDate) parts.push(`until: ${this.formatDate(m.endDate)}`);
            if (m.doctorName) parts.push(`by: Dr. ${m.doctorName}`);
            lines.push(`  - ${parts.join(' | ')}`);
            if (m.instructions?.trim()) {
              lines.push(`    Instructions: ${m.instructions.trim()}`);
            }
          }
        }
        if (other.length > 0) {
          lines.push('Paused / discontinued:');
          for (const m of other) {
            lines.push(`  - ${m.name} ${m.dose} [${m.status}]`);
          }
        }
        sections.push(lines.join('\n'));
      }

      // ── Recent Vitals ─────────────────────────────────────────────────────
      if (vitals.length > 0) {
        const lines = ['\n## Recent Vitals'];
        for (const v of vitals) {
          const parts: string[] = [
            `${this.formatDate(v.date)} ${v.time ?? ''} [${v.source}]`,
          ];
          if (v.systolicBp != null && v.diastolicBp != null)
            parts.push(`BP: ${v.systolicBp}/${v.diastolicBp} mmHg`);
          if (v.heartRate != null) parts.push(`HR: ${v.heartRate} bpm`);
          if (v.oxygenSaturation != null)
            parts.push(`SpO2: ${v.oxygenSaturation}%`);
          if (v.weight != null) parts.push(`Weight: ${v.weight} kg`);
          if (v.temperature != null) parts.push(`Temp: ${v.temperature}°C`);
          if (v.bloodSugar != null)
            parts.push(`Glucose: ${v.bloodSugar} mg/dL`);
          lines.push(`  ${parts.join(' | ')}`);
          if (v.notes?.trim()) lines.push(`    Note: ${v.notes.trim()}`);
        }
        sections.push(lines.join('\n'));
      }

      // ── Past Consultations ────────────────────────────────────────────────
      if (consultations.length > 0) {
        const lines = ['\n## Past Consultations (last 6)'];
        const diagsByConsId = this.groupBy(
          diagnosesRows,
          (d) => d.consultationId,
        );
        const rxByConsId = this.groupBy(
          prescriptionsRows,
          (p) => p.consultationId,
        );

        for (const c of consultations) {
          const date = this.formatDate(c.completedAt ?? c.startedAt);
          lines.push(
            `\n[${date}] ${c.visitType} | Dr. ${c.doctorName} | ${c.doctorSpecialty ?? 'Cardiology'}`,
          );
          if (c.chiefComplaint?.trim())
            lines.push(`  Complaint: ${c.chiefComplaint.trim()}`);
          if (c.historyOfPresentIllness?.trim())
            lines.push(
              `  HPI: ${c.historyOfPresentIllness.trim().slice(0, 300)}`,
            );

          const diags = diagsByConsId.get(c.id) ?? [];
          if (diags.length > 0) {
            lines.push(
              `  Diagnoses: ${diags.map((d) => `${d.description} [${d.icdCode}] (${d.type}, ${d.severity}${d.chronicFlag ? ', chronic' : ''})`).join('; ')}`,
            );
          }

          const rxs = rxByConsId.get(c.id) ?? [];
          if (rxs.length > 0) {
            lines.push(
              `  Prescribed: ${rxs.map((r) => `${r.name} ${r.dose} ${r.frequency}${r.isNew ? ' [new]' : ''}`).join('; ')}`,
            );
          }

          if (c.plan?.trim())
            lines.push(`  Plan: ${c.plan.trim().slice(0, 400)}`);
          if (c.notes?.trim())
            lines.push(`  Notes: ${c.notes.trim().slice(0, 300)}`);
          if (c.followUpInstructions?.trim())
            lines.push(`  Follow-up: ${c.followUpInstructions.trim()}`);
        }
        sections.push(lines.join('\n'));
      }

      // ── Recent Lab Results ────────────────────────────────────────────────
      if (labResults.length > 0) {
        const dedupedLabs = this.dedupeLabsByTestName(labResults);
        const lines = ['\n## Recent Lab Results'];
        for (const lr of dedupedLabs) {
          const val = lr.unit?.trim() ? `${lr.value} ${lr.unit}` : lr.value;
          const ref = lr.referenceRange ? ` (ref: ${lr.referenceRange})` : '';
          const date = this.formatDate(lr.resultAt);
          lines.push(
            `  - ${lr.testName}: ${val} [${lr.status}]${ref} — ${date}`,
          );
        }
        sections.push(lines.join('\n'));
      }

      // ── Clinical / AI Notes ───────────────────────────────────────────────
      if (clinicalNotes.length > 0) {
        const lines = ['\n## Clinical Notes'];
        for (const note of clinicalNotes) {
          const date = this.formatDate(note.createdAt);
          lines.push(`[${date}] ${note.body.trim()}`);
        }
        sections.push(lines.join('\n'));
      }

      sections.push('\n=== END PATIENT MEDICAL RECORD ===');
      return sections.join('\n');
    } catch (err) {
      this.logger.warn(
        'PatientMedicalContextService failed — returning empty context',
        err,
      );
      return '';
    }
  }

  private computeAge(dateOfBirth: Date | string): number {
    const dob =
      typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  }

  private formatDate(d: Date | string | null | undefined): string {
    if (!d) return 'unknown';
    const date = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(date.getTime())) return 'unknown';
    return date.toISOString().slice(0, 10);
  }

  private dedupeLabsByTestName<T extends { testName: string; resultAt: Date }>(
    rows: T[],
  ): T[] {
    const seen = new Map<string, T>();
    for (const row of rows) {
      const key = row.testName.trim().toLowerCase();
      if (!seen.has(key)) seen.set(key, row);
    }
    return Array.from(seen.values());
  }

  private groupBy<T>(arr: T[], keyFn: (item: T) => string): Map<string, T[]> {
    const map = new Map<string, T[]>();
    for (const item of arr) {
      const k = keyFn(item);
      const existing = map.get(k);
      if (existing) existing.push(item);
      else map.set(k, [item]);
    }
    return map;
  }
}
