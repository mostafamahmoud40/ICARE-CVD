import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, desc, eq, gte, inArray, lte, type SQL } from 'drizzle-orm';

import { DRIZZLE } from '../../../../database/drizzle.provider';
import type { Database } from '../../../../database/drizzle.provider';
import { formatUnknown, jsonToText } from '../../../../shared/format-unknown';
import {
  allergy,
  appointment,
  consultation,
  consultationCineMriAnalysis,
  consultationDiagnosis,
  consultationEcgAnalysis,
  consultationEchoAnalysis,
  consultationPrescription,
  consultationXrayAnalysis,
  diagnosis,
  doctor,
  doctorPatient,
  familyHistory,
  labResult,
  medication,
  patient,
  patientClinicalNote,
  patientHistory,
  patientQueue,
  procedureOrder,
  user,
  vitalReading,
} from '../../../../database/schema';

export type AccessiblePatient = {
  id: string;
  patientNumber: string;
  name: string;
  userId: number;
};

@Injectable()
export class DoctorToolsService {
  private readonly logger = new Logger(DoctorToolsService.name);

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  // ─── Security anchor ─────────────────────────────────────────────────────

  async getAccessiblePatientIds(doctorId: string): Promise<string[]> {
    const [assigned, fromAppts, fromCons, fromQueue] = await Promise.all([
      this.db
        .select({ id: doctorPatient.patientId })
        .from(doctorPatient)
        .where(
          and(
            eq(doctorPatient.doctorId, doctorId),
            eq(doctorPatient.status, 'active'),
          ),
        ),
      this.db
        .selectDistinct({ id: appointment.patientId })
        .from(appointment)
        .where(eq(appointment.doctorId, doctorId)),
      this.db
        .selectDistinct({ id: consultation.patientId })
        .from(consultation)
        .where(eq(consultation.doctorId, doctorId)),
      this.db
        .selectDistinct({ id: appointment.patientId })
        .from(patientQueue)
        .innerJoin(appointment, eq(patientQueue.appointmentId, appointment.id))
        .where(eq(appointment.doctorId, doctorId)),
    ]);

    const all = [
      ...assigned.map((r) => r.id),
      ...fromAppts.map((r) => r.id),
      ...fromCons.map((r) => r.id),
      ...fromQueue.map((r) => r.id),
    ].filter((id): id is string => Boolean(id));

    return [...new Set(all)];
  }

  /**
   * Resolve a patient identifier (UUID or patientNumber like "P-001") to a
   * patient that is accessible to this doctor.  Returns null if not found or
   * not authorised.
   */
  async resolveAccessiblePatient(
    doctorId: string,
    patientIdentifier: string,
  ): Promise<AccessiblePatient | null> {
    const accessibleIds = await this.getAccessiblePatientIds(doctorId);
    if (accessibleIds.length === 0) return null;

    const rows = await this.db
      .select({
        id: patient.id,
        patientNumber: patient.patientNumber,
        userId: patient.userId,
        name: user.name,
      })
      .from(patient)
      .innerJoin(user, eq(patient.userId, user.id))
      .where(inArray(patient.id, accessibleIds));

    return (
      rows.find(
        (p) =>
          p.id === patientIdentifier ||
          p.patientNumber === patientIdentifier ||
          p.name.toLowerCase() === patientIdentifier.toLowerCase(),
      ) ?? null
    );
  }

  // ─── Tool implementations ─────────────────────────────────────────────────

  /** Compact roster — names + patient numbers for all accessible patients. */
  async listPatients(doctorId: string): Promise<string> {
    const accessibleIds = await this.getAccessiblePatientIds(doctorId);
    if (accessibleIds.length === 0) return 'No patients in your panel.';

    const rows = await this.db
      .select({
        id: patient.id,
        patientNumber: patient.patientNumber,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        riskLevel: patient.riskLevel,
        name: user.name,
      })
      .from(patient)
      .innerJoin(user, eq(patient.userId, user.id))
      .where(inArray(patient.id, accessibleIds));

    const lines = rows.map((p) => {
      const age = this.computeAge(p.dateOfBirth);
      return `${p.patientNumber} | ${p.name} | ${age}${p.gender[0].toUpperCase()} | risk:${p.riskLevel}`;
    });

    return `${rows.length} patients:\n${lines.join('\n')}`;
  }

  /** Full profile + allergies + family history + active medications. */
  async getPatientOverview(
    doctorId: string,
    patientIdentifier: string,
  ): Promise<string> {
    const p = await this.resolveAccessiblePatient(doctorId, patientIdentifier);
    if (!p) return `Patient "${patientIdentifier}" is not in your panel.`;

    const [patientRow, historyRow, allergies, familyHistories, meds] =
      await Promise.all([
        this.db.query.patient.findFirst({ where: eq(patient.id, p.id) }),
        this.db.query.patientHistory.findFirst({
          where: eq(patientHistory.userId, p.userId),
        }),
        this.db.query.allergy.findMany({ where: eq(allergy.userId, p.userId) }),
        this.db.query.familyHistory.findMany({
          where: eq(familyHistory.userId, p.userId),
        }),
        this.db
          .select({
            name: medication.name,
            dose: medication.dose,
            frequency: medication.frequency,
            status: medication.status,
            compliance: medication.compliance,
            startDate: medication.startDate,
          })
          .from(medication)
          .where(eq(medication.userId, p.userId))
          .orderBy(desc(medication.createdAt)),
      ]);

    if (!patientRow) return 'Patient profile unavailable.';

    const age = this.computeAge(patientRow.dateOfBirth);
    const lines: string[] = [`## ${p.name} (${p.patientNumber})`];

    // Profile
    lines.push(
      [
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
        `Risk level: ${patientRow.riskLevel}`,
      ]
        .filter(Boolean)
        .join(' | '),
    );

    if (patientRow.aiRegistrationSummary?.trim()) {
      lines.push(
        `AI Summary: ${patientRow.aiRegistrationSummary.trim().slice(0, 400)}`,
      );
    }

    // Medical history
    if (historyRow) {
      const hParts: string[] = [];
      if (historyRow.chiefComplaint) {
        hParts.push(
          historyRow.chiefComplaint === 'other' &&
            historyRow.chiefComplaintOtherText
            ? historyRow.chiefComplaintOtherText
            : historyRow.chiefComplaint,
        );
      }
      if (!historyRow.noCardiacHistory && historyRow.pastCardiacHistory) {
        hParts.push(
          `Cardiac: ${jsonToText(historyRow.pastCardiacHistory).slice(0, 200)}`,
        );
      }
      if (!historyRow.noNonCardiacHistory && historyRow.pastNonCardiacHistory) {
        hParts.push(
          `Non-cardiac: ${jsonToText(historyRow.pastNonCardiacHistory).slice(0, 200)}`,
        );
      }
      if (historyRow.cardiovascularRiskFactors) {
        hParts.push(
          `CVD risks: ${jsonToText(historyRow.cardiovascularRiskFactors).slice(0, 200)}`,
        );
      }
      if (historyRow.medicalHistoryNotes?.trim()) {
        hParts.push(
          `Notes: ${historyRow.medicalHistoryNotes.trim().slice(0, 300)}`,
        );
      }
      if (hParts.length > 0)
        lines.push(`Medical history: ${hParts.join(' · ')}`);
    }

    // Allergies
    if (allergies.length > 0) {
      lines.push(
        `Allergies: ${allergies.map((a) => `${a.allergen}(${a.category}${a.reaction ? '→' + a.reaction : ''})`).join('; ')}`,
      );
    } else {
      lines.push('Allergies: none recorded');
    }

    // Family history
    if (familyHistories.length > 0) {
      lines.push(
        `Family history: ${familyHistories.map((f) => `${f.relationship}: ${f.condition}`).join('; ')}`,
      );
    }

    // Medications
    const activeMeds = meds.filter((m) => m.status === 'active');
    const stoppedMeds = meds.filter((m) => m.status !== 'active');
    if (activeMeds.length > 0) {
      lines.push(
        `Active medications (${activeMeds.length}): ${activeMeds.map((m) => `${m.name} ${m.dose} ${m.frequency}${m.compliance ? ' [' + m.compliance + ']' : ''}`).join('; ')}`,
      );
    } else {
      lines.push('Active medications: none');
    }
    if (stoppedMeds.length > 0) {
      lines.push(
        `Paused/discontinued: ${stoppedMeds.map((m) => `${m.name}[${m.status}]`).join(', ')}`,
      );
    }

    return lines.join('\n');
  }

  /** Last 6 completed consultations with diagnoses + prescriptions + plan. */
  async getPatientConsultations(
    doctorId: string,
    patientIdentifier: string,
  ): Promise<string> {
    const p = await this.resolveAccessiblePatient(doctorId, patientIdentifier);
    if (!p) return `Patient "${patientIdentifier}" is not in your panel.`;

    const cons = await this.db
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
          eq(consultation.patientId, p.id),
          eq(consultation.status, 'completed'),
        ),
      )
      .orderBy(desc(consultation.completedAt))
      .limit(6);

    if (cons.length === 0) return `${p.name}: no completed consultations.`;

    const consIds = cons.map((c) => c.id);
    const [diagRows, rxRows] = await Promise.all([
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
        .where(inArray(consultationDiagnosis.consultationId, consIds)),
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
        .where(inArray(consultationPrescription.consultationId, consIds)),
    ]);

    const diagByConsId = this.groupBy(diagRows, (d) => d.consultationId);
    const rxByConsId = this.groupBy(rxRows, (r) => r.consultationId);

    const lines: string[] = [
      `## ${p.name} — Consultations (last ${cons.length})`,
    ];
    for (const c of cons) {
      const date = this.formatDate(c.completedAt ?? c.startedAt);
      lines.push(
        `\n[${date}] ${c.visitType} | Dr. ${c.doctorName}${c.doctorSpecialty ? ' | ' + c.doctorSpecialty : ''}`,
      );
      if (c.chiefComplaint?.trim())
        lines.push(`  Complaint: ${c.chiefComplaint.trim()}`);
      if (c.historyOfPresentIllness?.trim())
        lines.push(`  HPI: ${c.historyOfPresentIllness.trim().slice(0, 200)}`);
      const diags = diagByConsId.get(c.id) ?? [];
      if (diags.length > 0)
        lines.push(
          `  Diagnoses: ${diags.map((d) => `${d.description}[${d.icdCode}](${d.type},${d.severity}${d.chronicFlag ? ',chronic' : ''})`).join('; ')}`,
        );
      const rxs = rxByConsId.get(c.id) ?? [];
      if (rxs.length > 0)
        lines.push(
          `  Prescribed: ${rxs.map((r) => `${r.name} ${r.dose}${r.isNew ? '[new]' : ''}`).join('; ')}`,
        );
      if (c.plan?.trim()) lines.push(`  Plan: ${c.plan.trim().slice(0, 300)}`);
      if (c.notes?.trim())
        lines.push(`  Notes: ${c.notes.trim().slice(0, 200)}`);
      if (c.followUpInstructions?.trim())
        lines.push(`  Follow-up: ${c.followUpInstructions.trim()}`);
    }

    return lines.join('\n');
  }

  /** All medications — active and history — with compliance and dates. */
  async getPatientMedications(
    doctorId: string,
    patientIdentifier: string,
  ): Promise<string> {
    const p = await this.resolveAccessiblePatient(doctorId, patientIdentifier);
    if (!p) return `Patient "${patientIdentifier}" is not in your panel.`;

    const meds = await this.db
      .select({
        name: medication.name,
        dose: medication.dose,
        frequency: medication.frequency,
        type: medication.type,
        status: medication.status,
        compliance: medication.compliance,
        adherencePercent: medication.adherencePercent,
        sideEffects: medication.sideEffects,
        instructions: medication.instructions,
        startDate: medication.startDate,
        endDate: medication.endDate,
        prescribedAt: medication.createdAt,
        doctorName: user.name,
      })
      .from(medication)
      .leftJoin(doctor, eq(medication.prescribedBy, doctor.id))
      .leftJoin(user, eq(doctor.userId, user.id))
      .where(eq(medication.userId, p.userId))
      .orderBy(desc(medication.createdAt));

    if (meds.length === 0) return `${p.name}: no medications recorded.`;

    const active = meds.filter((m) => m.status === 'active');
    const other = meds.filter((m) => m.status !== 'active');
    const lines: string[] = [`## ${p.name} — Medications`];

    if (active.length > 0) {
      lines.push(`\nActive (${active.length}):`);
      for (const m of active) {
        lines.push(
          `  ${m.name} ${m.dose} ${m.frequency} [${m.compliance ?? 'unknown'} compliance, ${m.adherencePercent}%]`,
        );
        if (m.startDate)
          lines.push(
            `    From: ${this.formatDate(m.startDate)}${m.endDate ? ' → ' + this.formatDate(m.endDate) : ''}`,
          );
        if (m.sideEffects?.trim())
          lines.push(`    Side effects: ${m.sideEffects.trim()}`);
        if (m.instructions?.trim())
          lines.push(`    Instructions: ${m.instructions.trim()}`);
        if (m.doctorName) lines.push(`    Prescribed by: Dr. ${m.doctorName}`);
      }
    }
    if (other.length > 0) {
      lines.push(`\nPaused/discontinued (${other.length}):`);
      for (const m of other) {
        lines.push(
          `  ${m.name} ${m.dose} [${m.status}] — from ${this.formatDate(m.startDate)}`,
        );
      }
    }

    return lines.join('\n');
  }

  /** Recent vital readings — home + clinic. */
  async getPatientVitals(
    doctorId: string,
    patientIdentifier: string,
  ): Promise<string> {
    const p = await this.resolveAccessiblePatient(doctorId, patientIdentifier);
    if (!p) return `Patient "${patientIdentifier}" is not in your panel.`;

    const vitals = await this.db
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
      .where(eq(vitalReading.patientId, p.id))
      .orderBy(desc(vitalReading.createdAt))
      .limit(10);

    if (vitals.length === 0) return `${p.name}: no vital readings recorded.`;

    const lines: string[] = [`## ${p.name} — Vitals (last ${vitals.length})`];
    for (const v of vitals) {
      const parts: string[] = [
        `[${this.formatDate(v.date)} ${v.time ?? ''} | ${v.source}]`,
      ];
      if (v.systolicBp != null && v.diastolicBp != null)
        parts.push(`BP ${v.systolicBp}/${v.diastolicBp} mmHg`);
      if (v.heartRate != null) parts.push(`HR ${v.heartRate} bpm`);
      if (v.oxygenSaturation != null) parts.push(`SpO2 ${v.oxygenSaturation}%`);
      if (v.weight != null) parts.push(`Wt ${v.weight} kg`);
      if (v.temperature != null) parts.push(`T ${v.temperature}°C`);
      if (v.bloodSugar != null) parts.push(`Glucose ${v.bloodSugar} mg/dL`);
      lines.push(`  ${parts.join(' | ')}`);
      if (v.notes?.trim()) lines.push(`    Note: ${v.notes.trim()}`);
    }

    return lines.join('\n');
  }

  /** Latest lab results — deduped by test name. */
  async getPatientLabResults(
    doctorId: string,
    patientIdentifier: string,
  ): Promise<string> {
    const p = await this.resolveAccessiblePatient(doctorId, patientIdentifier);
    if (!p) return `Patient "${patientIdentifier}" is not in your panel.`;

    const labs = await this.db
      .select({
        testName: labResult.testName,
        value: labResult.value,
        unit: labResult.unit,
        referenceRange: labResult.referenceRange,
        status: labResult.status,
        resultAt: labResult.resultAt,
        orderedBy: labResult.orderedBy,
      })
      .from(labResult)
      .where(eq(labResult.patientId, p.id))
      .orderBy(desc(labResult.resultAt))
      .limit(50);

    if (labs.length === 0) return `${p.name}: no lab results recorded.`;

    const deduped = this.dedupeByTestName(labs);
    const lines: string[] = [
      `## ${p.name} — Lab Results (latest per test, ${deduped.length} tests)`,
    ];
    const abnormal = deduped.filter((l) => l.status !== 'normal');
    const normal = deduped.filter((l) => l.status === 'normal');

    if (abnormal.length > 0) {
      lines.push('\n⚠ Abnormal:');
      for (const l of abnormal) {
        const val = l.unit?.trim() ? `${l.value} ${l.unit}` : l.value;
        const ref = l.referenceRange ? ` (ref: ${l.referenceRange})` : '';
        lines.push(
          `  ${l.testName}: ${val} [${l.status.toUpperCase()}]${ref} — ${this.formatDate(l.resultAt)}`,
        );
      }
    }
    if (normal.length > 0) {
      lines.push('\nNormal:');
      for (const l of normal) {
        const val = l.unit?.trim() ? `${l.value} ${l.unit}` : l.value;
        lines.push(`  ${l.testName}: ${val} — ${this.formatDate(l.resultAt)}`);
      }
    }

    return lines.join('\n');
  }

  /** Clinical notes and AI-generated notes. */
  async getPatientClinicalNotes(
    doctorId: string,
    patientIdentifier: string,
  ): Promise<string> {
    const p = await this.resolveAccessiblePatient(doctorId, patientIdentifier);
    if (!p) return `Patient "${patientIdentifier}" is not in your panel.`;

    const notes = await this.db
      .select({
        body: patientClinicalNote.body,
        createdAt: patientClinicalNote.createdAt,
      })
      .from(patientClinicalNote)
      .where(eq(patientClinicalNote.patientId, p.id))
      .orderBy(desc(patientClinicalNote.createdAt))
      .limit(20);

    if (notes.length === 0) return `${p.name}: no clinical notes.`;

    const lines: string[] = [`## ${p.name} — Clinical Notes (${notes.length})`];
    for (const note of notes) {
      lines.push(`\n[${this.formatDate(note.createdAt)}]\n${note.body.trim()}`);
    }

    return lines.join('\n');
  }

  /** Procedure orders — pending, in-progress, completed. */
  async getPatientProcedures(
    doctorId: string,
    patientIdentifier: string,
  ): Promise<string> {
    const p = await this.resolveAccessiblePatient(doctorId, patientIdentifier);
    if (!p) return `Patient "${patientIdentifier}" is not in your panel.`;

    const procs = await this.db
      .select({
        procedureName: procedureOrder.procedureName,
        department: procedureOrder.department,
        status: procedureOrder.status,
        priority: procedureOrder.priority,
        scheduledAt: procedureOrder.scheduledAt,
        actualEndAt: procedureOrder.actualEndAt,
        notes: procedureOrder.notes,
        riskScore: procedureOrder.riskScore,
        createdAt: procedureOrder.createdAt,
      })
      .from(procedureOrder)
      .where(eq(procedureOrder.patientId, p.id))
      .orderBy(desc(procedureOrder.createdAt))
      .limit(10);

    if (procs.length === 0) return `${p.name}: no procedures recorded.`;

    const lines: string[] = [`## ${p.name} — Procedures (${procs.length})`];
    for (const proc of procs) {
      const scheduled = proc.scheduledAt
        ? ` | Scheduled: ${this.formatDate(proc.scheduledAt)}`
        : '';
      const completed = proc.actualEndAt
        ? ` | Completed: ${this.formatDate(proc.actualEndAt)}`
        : '';
      lines.push(
        `\n${proc.procedureName} [${proc.status}/${proc.priority}]${scheduled}${completed}`,
      );
      lines.push(
        `  Dept: ${proc.department}${proc.riskScore ? ' | Risk: ' + proc.riskScore : ''}`,
      );
      if (proc.notes?.trim())
        lines.push(`  Notes: ${proc.notes.trim().slice(0, 200)}`);
    }

    return lines.join('\n');
  }

  /** All AI analyses: Echo, ECG, X-ray, Cine-MRI. */
  async getPatientAiAnalyses(
    doctorId: string,
    patientIdentifier: string,
  ): Promise<string> {
    const p = await this.resolveAccessiblePatient(doctorId, patientIdentifier);
    if (!p) return `Patient "${patientIdentifier}" is not in your panel.`;

    const [echos, ecgs, xrays, mris] = await Promise.all([
      this.db
        .select({
          aiReport: consultationEchoAnalysis.aiReport,
          analysisJson: consultationEchoAnalysis.analysisJson,
          createdAt: consultationEchoAnalysis.createdAt,
        })
        .from(consultationEchoAnalysis)
        .where(eq(consultationEchoAnalysis.patientId, p.id))
        .orderBy(desc(consultationEchoAnalysis.createdAt))
        .limit(3),
      this.db
        .select({
          aiReportJson: consultationEcgAnalysis.aiReportJson,
          analysisJson: consultationEcgAnalysis.analysisJson,
          createdAt: consultationEcgAnalysis.createdAt,
        })
        .from(consultationEcgAnalysis)
        .where(eq(consultationEcgAnalysis.patientId, p.id))
        .orderBy(desc(consultationEcgAnalysis.createdAt))
        .limit(3),
      this.db
        .select({
          riskLevel: consultationXrayAnalysis.riskLevel,
          analysisJson: consultationXrayAnalysis.analysisJson,
          createdAt: consultationXrayAnalysis.createdAt,
        })
        .from(consultationXrayAnalysis)
        .where(eq(consultationXrayAnalysis.patientId, p.id))
        .orderBy(desc(consultationXrayAnalysis.createdAt))
        .limit(3),
      this.db
        .select({
          diagnosisClass: consultationCineMriAnalysis.diagnosisClass,
          analysisJson: consultationCineMriAnalysis.analysisJson,
          createdAt: consultationCineMriAnalysis.createdAt,
        })
        .from(consultationCineMriAnalysis)
        .where(eq(consultationCineMriAnalysis.patientId, p.id))
        .orderBy(desc(consultationCineMriAnalysis.createdAt))
        .limit(3),
    ]);

    const hasAny = echos.length + ecgs.length + xrays.length + mris.length > 0;
    if (!hasAny) return `${p.name}: no AI analyses recorded.`;

    const lines: string[] = [`## ${p.name} — AI Analyses`];

    for (const e of echos) {
      lines.push(`\nEchocardiogram [${this.formatDate(e.createdAt)}]:`);
      if (e.aiReport?.trim()) {
        lines.push(e.aiReport.trim().slice(0, 800));
      } else {
        lines.push(this.extractJsonSummary(e.analysisJson));
      }
    }
    for (const e of ecgs) {
      lines.push(`\nECG [${this.formatDate(e.createdAt)}]:`);
      lines.push(
        this.extractEcgSummary(e.aiReportJson) ||
          this.extractJsonSummary(e.analysisJson),
      );
    }
    for (const x of xrays) {
      lines.push(
        `\nChest X-ray [${this.formatDate(x.createdAt)}] — Risk: ${x.riskLevel}:`,
      );
      lines.push(this.extractJsonSummary(x.analysisJson));
    }
    for (const m of mris) {
      lines.push(
        `\nCine-MRI [${this.formatDate(m.createdAt)}] — Class: ${m.diagnosisClass}:`,
      );
      lines.push(this.extractMriSummary(m.analysisJson, m.diagnosisClass));
    }

    return lines.join('\n');
  }

  /** Full diagnoses list for a patient (all-time). */
  async getPatientDiagnoses(
    doctorId: string,
    patientIdentifier: string,
  ): Promise<string> {
    const p = await this.resolveAccessiblePatient(doctorId, patientIdentifier);
    if (!p) return `Patient "${patientIdentifier}" is not in your panel.`;

    const diagnoses = await this.db
      .select({
        icdCode: diagnosis.icdCode,
        description: diagnosis.description,
        category: diagnosis.category,
        type: diagnosis.type,
        severity: diagnosis.severity,
        status: diagnosis.status,
        chronicFlag: diagnosis.chronicFlag,
        onsetDate: diagnosis.onsetDate,
        nyhaClass: diagnosis.nyhaClass,
        clinicalNotes: diagnosis.clinicalNotes,
        diagnosedAt: diagnosis.diagnosedAt,
      })
      .from(diagnosis)
      .where(eq(diagnosis.patientId, p.id))
      .orderBy(desc(diagnosis.diagnosedAt));

    if (diagnoses.length === 0) return `${p.name}: no diagnoses recorded.`;

    const lines: string[] = [`## ${p.name} — Diagnoses (${diagnoses.length})`];
    const active = diagnoses.filter(
      (d) => d.status === 'active' || d.status === 'chronic',
    );
    const resolved = diagnoses.filter((d) => d.status === 'resolved');

    if (active.length > 0) {
      lines.push('\nActive/Chronic:');
      for (const d of active) {
        const nyha = d.nyhaClass ? ` NYHA ${d.nyhaClass}` : '';
        const onset = d.onsetDate
          ? ` onset: ${this.formatDate(d.onsetDate)}`
          : '';
        lines.push(
          `  ${d.description} [${d.icdCode}] (${d.type}, ${d.severity}${d.chronicFlag ? ', chronic' : ''}${nyha}${onset})`,
        );
        if (d.clinicalNotes?.trim())
          lines.push(`    Notes: ${d.clinicalNotes.trim().slice(0, 150)}`);
      }
    }
    if (resolved.length > 0) {
      lines.push('\nResolved:');
      for (const d of resolved) {
        lines.push(`  ${d.description} [${d.icdCode}]`);
      }
    }

    return lines.join('\n');
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

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

  private extractJsonSummary(json: string | null | undefined): string {
    if (!json?.trim()) return '(no data)';
    try {
      const parsed = JSON.parse(json) as Record<string, unknown>;
      const fields = [
        'findings',
        'impression',
        'diagnosis',
        'interpretation',
        'summary',
      ];
      for (const f of fields) {
        if (parsed[f]) {
          const val = parsed[f];
          return (
            Array.isArray(val)
              ? val.map(formatUnknown).join(', ')
              : formatUnknown(val)
          ).slice(0, 500);
        }
      }
      return JSON.stringify(parsed).slice(0, 300);
    } catch {
      return json.trim().slice(0, 300);
    }
  }

  private extractEcgSummary(reportJson: string | null | undefined): string {
    if (!reportJson?.trim()) return '';
    try {
      const parsed = JSON.parse(reportJson) as Record<string, unknown>;
      const parts: string[] = [];
      if (parsed.diagnosis) parts.push(formatUnknown(parsed.diagnosis));
      if (parsed.rhythm) parts.push(`rhythm: ${formatUnknown(parsed.rhythm)}`);
      if (parsed.findings) {
        parts.push(
          `findings: ${
            Array.isArray(parsed.findings)
              ? parsed.findings.slice(0, 3).map(formatUnknown).join(', ')
              : formatUnknown(parsed.findings)
          }`,
        );
      }
      if (parsed.interpretation) {
        parts.push(formatUnknown(parsed.interpretation).slice(0, 200));
      }
      return parts.join(' | ').slice(0, 500);
    } catch {
      return reportJson.trim().slice(0, 500);
    }
  }

  private extractMriSummary(
    analysisJson: string,
    diagnosisClass: string,
  ): string {
    try {
      const parsed = JSON.parse(analysisJson) as Record<string, unknown>;
      const parts = [`Class: ${diagnosisClass}`];
      if (parsed.ef !== undefined)
        parts.push(`EF: ${formatUnknown(parsed.ef)}%`);
      if (parsed.edv !== undefined) {
        parts.push(`EDV: ${formatUnknown(parsed.edv)} ml`);
      }
      if (parsed.esv !== undefined) {
        parts.push(`ESV: ${formatUnknown(parsed.esv)} ml`);
      }
      if (parsed.sv !== undefined)
        parts.push(`SV: ${formatUnknown(parsed.sv)} ml`);
      if (parsed.interpretation) {
        parts.push(formatUnknown(parsed.interpretation).slice(0, 200));
      }
      return parts.join(' | ').slice(0, 500);
    } catch {
      return `Class: ${diagnosisClass}`;
    }
  }

  private dedupeByTestName<T extends { testName: string }>(rows: T[]): T[] {
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

  // ─── Patient search ────────────────────────────────────────────────────────

  /**
   * Search the doctor's accessible patients by a natural-language criterion.
   * Supported criteria (keywords detected):
   *  - procedure / operation / surgery / tomorrow / today / pending
   *  - high risk / خطورة
   *  - abnormal / غير طبيعي (lab results)
   *  - follow up / متابعة
   *  - medication / دواء
   * Returns a formatted list of matching patients with relevant context.
   */
  async searchPatients(doctorId: string, criteria: string): Promise<string> {
    const accessibleIds = await this.getAccessiblePatientIds(doctorId);
    if (accessibleIds.length === 0) return 'No patients in your panel.';

    const lower = criteria.toLowerCase();

    // ── Procedures (today / tomorrow / pending) ──────────────────────────
    const isProcedureQuery =
      /procedure|operation|surgery|عملية|إجراء|قسطرة|oper/i.test(criteria);
    const isTomorrow = /tomorrow|بكرا|بكره|غداً|غدا/i.test(criteria);
    const isToday = /today|النهارده|اليوم/i.test(criteria);
    const isPending = /pending|مجدول|scheduled|قادم/i.test(criteria);

    if (isProcedureQuery || isTomorrow || isToday || isPending) {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      const tomorrowEnd = new Date(tomorrowStart);
      tomorrowEnd.setHours(23, 59, 59, 999);

      let dateFilter: SQL | undefined;
      if (isTomorrow) {
        dateFilter = and(
          gte(procedureOrder.scheduledAt, tomorrowStart),
          lte(procedureOrder.scheduledAt, tomorrowEnd),
        );
      } else if (isToday) {
        dateFilter = and(
          gte(procedureOrder.scheduledAt, todayStart),
          lte(procedureOrder.scheduledAt, todayEnd),
        );
      } else {
        // pending / upcoming — all procedures with status pending/scheduled
        dateFilter = gte(procedureOrder.scheduledAt, todayStart);
      }

      const procs = await this.db
        .select({
          patientId: procedureOrder.patientId,
          procedureName: procedureOrder.procedureName,
          status: procedureOrder.status,
          priority: procedureOrder.priority,
          scheduledAt: procedureOrder.scheduledAt,
          patientNumber: patient.patientNumber,
          name: user.name,
        })
        .from(procedureOrder)
        .innerJoin(patient, eq(procedureOrder.patientId, patient.id))
        .innerJoin(user, eq(patient.userId, user.id))
        .where(
          and(inArray(procedureOrder.patientId, accessibleIds), dateFilter),
        )
        .orderBy(procedureOrder.scheduledAt);

      if (procs.length === 0) {
        const timeLabel = isTomorrow
          ? 'tomorrow'
          : isToday
            ? 'today'
            : 'upcoming';
        return `No patients with ${timeLabel} procedures found.`;
      }

      const lines = [`Found ${procs.length} patient(s) with procedures:`];
      for (const p of procs) {
        const date = this.formatDate(p.scheduledAt);
        lines.push(
          `  ${p.patientNumber} | ${p.name} — ${p.procedureName} [${p.status}/${p.priority}] scheduled: ${date}`,
        );
      }
      return lines.join('\n');
    }

    // ── High risk patients ────────────────────────────────────────────────
    if (/high.?risk|خطورة عاليه|خطورة عالية|high risk/i.test(lower)) {
      const rows = await this.db
        .select({
          id: patient.id,
          patientNumber: patient.patientNumber,
          name: user.name,
          riskLevel: patient.riskLevel,
          dateOfBirth: patient.dateOfBirth,
        })
        .from(patient)
        .innerJoin(user, eq(patient.userId, user.id))
        .where(
          and(
            inArray(patient.id, accessibleIds),
            eq(patient.riskLevel, 'high'),
          ),
        );

      if (rows.length === 0)
        return 'No high-risk patients found in your panel.';
      const lines = [`${rows.length} high-risk patient(s):`];
      for (const p of rows) {
        const age = this.computeAge(p.dateOfBirth);
        lines.push(
          `  ${p.patientNumber} | ${p.name} | Age ${age} | Risk: ${p.riskLevel}`,
        );
      }
      return lines.join('\n');
    }

    // ── Abnormal lab results ──────────────────────────────────────────────
    if (/abnormal|غير طبيعي|critical|high lab|low lab/i.test(lower)) {
      const abnormalLabs = await this.db
        .select({
          patientId: labResult.patientId,
          testName: labResult.testName,
          value: labResult.value,
          status: labResult.status,
          resultAt: labResult.resultAt,
          patientNumber: patient.patientNumber,
          name: user.name,
        })
        .from(labResult)
        .innerJoin(patient, eq(labResult.patientId, patient.id))
        .innerJoin(user, eq(patient.userId, user.id))
        .where(
          and(
            inArray(labResult.patientId, accessibleIds),
            inArray(labResult.status, ['low', 'high', 'critical']),
          ),
        )
        .orderBy(desc(labResult.resultAt))
        .limit(20);

      if (abnormalLabs.length === 0)
        return 'No patients with abnormal lab results found.';

      const byPatient = new Map<string, typeof abnormalLabs>();
      for (const r of abnormalLabs) {
        const key = r.patientId;
        const arr = byPatient.get(key) ?? [];
        arr.push(r);
        byPatient.set(key, arr);
      }

      const lines = [`${byPatient.size} patient(s) with abnormal labs:`];
      for (const [, results] of byPatient) {
        const first = results[0];
        lines.push(
          `  ${first.patientNumber} | ${first.name}: ${results.map((r) => `${r.testName}[${r.status?.toUpperCase() ?? 'ABNORMAL'}]`).join(', ')}`,
        );
      }
      return lines.join('\n');
    }

    // ── Follow-up needed ─────────────────────────────────────────────────
    if (/follow.?up|متابعة|متابعه|follow up/i.test(lower)) {
      const recent = await this.db
        .select({
          patientId: consultation.patientId,
          followUpInstructions: consultation.followUpInstructions,
          completedAt: consultation.completedAt,
          patientNumber: patient.patientNumber,
          name: user.name,
        })
        .from(consultation)
        .innerJoin(patient, eq(consultation.patientId, patient.id))
        .innerJoin(user, eq(patient.userId, user.id))
        .where(
          and(
            inArray(consultation.patientId, accessibleIds),
            eq(consultation.status, 'completed'),
          ),
        )
        .orderBy(desc(consultation.completedAt))
        .limit(30);

      const withFollowUp = recent.filter((r) => r.followUpInstructions?.trim());

      if (withFollowUp.length === 0)
        return 'No recent consultations with follow-up instructions.';

      const lines = [
        `${withFollowUp.length} consultation(s) with follow-up instructions:`,
      ];
      for (const c of withFollowUp.slice(0, 10)) {
        lines.push(
          `  ${c.patientNumber} | ${c.name} [${this.formatDate(c.completedAt)}]: ${c.followUpInstructions!.trim().slice(0, 100)}`,
        );
      }
      return lines.join('\n');
    }

    // ── Default: return the full roster (fallback) ────────────────────────
    return this.listPatients(doctorId);
  }
}
