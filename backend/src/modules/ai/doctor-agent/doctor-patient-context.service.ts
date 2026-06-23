import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';

import { DRIZZLE } from '../../../database/drizzle.provider';
import type { Database } from '../../../database/drizzle.provider';
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
} from '../../../database/schema';

@Injectable()
export class DoctorPatientContextService {
  private readonly logger = new Logger(DoctorPatientContextService.name);

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /**
   * Build full clinical context for every patient accessible by this doctor.
   * Returns a structured text block ready to embed in a system prompt.
   */
  async build(doctorUserId: number, focusPatientId?: string): Promise<string> {
    try {
      const doctorRow = await this.db.query.doctor.findFirst({
        where: eq(doctor.userId, doctorUserId),
      });
      if (!doctorRow) return '';

      const doctorId = doctorRow.id;

      // ── Resolve all accessible patient IDs (security boundary) ──────────
      const patientIds = await this.getAccessiblePatientIds(doctorId);
      if (patientIds.length === 0) return '=== PATIENTS: none ===';

      // ── Fetch ALL accessible patient profiles first ───────────────────────
      const allPatientRows = await this.db
        .select({
          id: patient.id,
          patientNumber: patient.patientNumber,
          userId: patient.userId,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
          bloodType: patient.bloodType,
          heightCm: patient.heightCm,
          weightKg: patient.weightKg,
          bmi: patient.bmi,
          smokingStatus: patient.smokingStatus,
          alcoholConsumption: patient.alcoholConsumption,
          exerciseFrequency: patient.exerciseFrequency,
          dietaryHabits: patient.dietaryHabits,
          riskLevel: patient.riskLevel,
          aiRegistrationSummary: patient.aiRegistrationSummary,
          name: user.name,
          phone: user.phone,
          email: user.email,
        })
        .from(patient)
        .innerJoin(user, eq(patient.userId, user.id))
        .where(inArray(patient.id, patientIds));

      if (allPatientRows.length === 0) return '=== PATIENTS: none ===';

      // Apply focus AFTER resolving accessible rows — accepts UUID or patientNumber (e.g. P-001).
      // Security: can never return a patient outside this doctor's accessible set.
      const patientRows = focusPatientId
        ? allPatientRows.filter(
            (p) =>
              p.id === focusPatientId ||
              p.patientNumber === focusPatientId,
          )
        : allPatientRows;

      if (patientRows.length === 0)
        return '=== PATIENTS: no matching patient in your panel ===';

      const patientIdList = patientRows.map((p) => p.id);
      const userIdList = patientRows.map((p) => p.userId);

      // ── Batch-fetch all supporting data ─────────────────────────────────
      const [
        histories,
        allergies,
        familyHistories,
        medications,
        vitals,
        consultations,
        labResults,
        clinicalNotes,
        procedures,
        echoAnalyses,
        ecgAnalyses,
        xrayAnalyses,
        cineMriAnalyses,
      ] = await Promise.all([
        this.db.query.patientHistory.findMany({
          where: inArray(patientHistory.userId, userIdList),
        }),
        this.db.query.allergy.findMany({
          where: inArray(allergy.userId, userIdList),
        }),
        this.db.query.familyHistory.findMany({
          where: inArray(familyHistory.userId, userIdList),
        }),
        this.db
          .select({
            userId: medication.userId,
            name: medication.name,
            dose: medication.dose,
            frequency: medication.frequency,
            type: medication.type,
            status: medication.status,
            compliance: medication.compliance,
            startDate: medication.startDate,
            endDate: medication.endDate,
            instructions: medication.instructions,
          })
          .from(medication)
          .where(
            and(
              inArray(medication.userId, userIdList),
            ),
          )
          .orderBy(desc(medication.createdAt)),
        this.db
          .select({
            patientId: vitalReading.patientId,
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
          .where(inArray(vitalReading.patientId, patientIdList))
          .orderBy(desc(vitalReading.createdAt))
          .limit(patientIdList.length * 5),
        this.db
          .select({
            id: consultation.id,
            patientId: consultation.patientId,
            visitType: consultation.visitType,
            chiefComplaint: consultation.chiefComplaint,
            historyOfPresentIllness: consultation.historyOfPresentIllness,
            plan: consultation.plan,
            notes: consultation.notes,
            followUpInstructions: consultation.followUpInstructions,
            completedAt: consultation.completedAt,
            startedAt: consultation.startedAt,
            doctorName: user.name,
          })
          .from(consultation)
          .innerJoin(doctor, eq(consultation.doctorId, doctor.id))
          .innerJoin(user, eq(doctor.userId, user.id))
          .where(
            and(
              inArray(consultation.patientId, patientIdList),
              eq(consultation.status, 'completed'),
            ),
          )
          .orderBy(desc(consultation.completedAt))
          .limit(patientIdList.length * 4),
        this.db
          .select({
            patientId: labResult.patientId,
            testName: labResult.testName,
            value: labResult.value,
            unit: labResult.unit,
            referenceRange: labResult.referenceRange,
            status: labResult.status,
            resultAt: labResult.resultAt,
          })
          .from(labResult)
          .where(inArray(labResult.patientId, patientIdList))
          .orderBy(desc(labResult.resultAt))
          .limit(patientIdList.length * 10),
        this.db
          .select({
            patientId: patientClinicalNote.patientId,
            body: patientClinicalNote.body,
            createdAt: patientClinicalNote.createdAt,
          })
          .from(patientClinicalNote)
          .where(inArray(patientClinicalNote.patientId, patientIdList))
          .orderBy(desc(patientClinicalNote.createdAt))
          .limit(patientIdList.length * 5),
        this.db
          .select({
            patientId: procedureOrder.patientId,
            procedureName: procedureOrder.procedureName,
            department: procedureOrder.department,
            status: procedureOrder.status,
            priority: procedureOrder.priority,
            scheduledAt: procedureOrder.scheduledAt,
            notes: procedureOrder.notes,
            createdAt: procedureOrder.createdAt,
          })
          .from(procedureOrder)
          .where(inArray(procedureOrder.patientId, patientIdList))
          .orderBy(desc(procedureOrder.createdAt))
          .limit(patientIdList.length * 3),
        this.db
          .select({
            patientId: consultationEchoAnalysis.patientId,
            aiReport: consultationEchoAnalysis.aiReport,
            createdAt: consultationEchoAnalysis.createdAt,
          })
          .from(consultationEchoAnalysis)
          .where(inArray(consultationEchoAnalysis.patientId, patientIdList))
          .orderBy(desc(consultationEchoAnalysis.createdAt))
          .limit(patientIdList.length * 2),
        this.db
          .select({
            patientId: consultationEcgAnalysis.patientId,
            aiReportJson: consultationEcgAnalysis.aiReportJson,
            createdAt: consultationEcgAnalysis.createdAt,
          })
          .from(consultationEcgAnalysis)
          .where(inArray(consultationEcgAnalysis.patientId, patientIdList))
          .orderBy(desc(consultationEcgAnalysis.createdAt))
          .limit(patientIdList.length * 2),
        this.db
          .select({
            patientId: consultationXrayAnalysis.patientId,
            riskLevel: consultationXrayAnalysis.riskLevel,
            analysisJson: consultationXrayAnalysis.analysisJson,
            createdAt: consultationXrayAnalysis.createdAt,
          })
          .from(consultationXrayAnalysis)
          .where(inArray(consultationXrayAnalysis.patientId, patientIdList))
          .orderBy(desc(consultationXrayAnalysis.createdAt))
          .limit(patientIdList.length * 2),
        this.db
          .select({
            patientId: consultationCineMriAnalysis.patientId,
            diagnosisClass: consultationCineMriAnalysis.diagnosisClass,
            analysisJson: consultationCineMriAnalysis.analysisJson,
            createdAt: consultationCineMriAnalysis.createdAt,
          })
          .from(consultationCineMriAnalysis)
          .where(inArray(consultationCineMriAnalysis.patientId, patientIdList))
          .orderBy(desc(consultationCineMriAnalysis.createdAt))
          .limit(patientIdList.length * 2),
      ]);

      // ── Fetch diagnoses + prescriptions for consultations ───────────────
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
                .innerJoin(diagnosis, eq(consultationDiagnosis.diagnosisId, diagnosis.id))
                .where(inArray(consultationDiagnosis.consultationId, consultationIds)),
              this.db
                .select({
                  consultationId: consultationPrescription.consultationId,
                  name: medication.name,
                  dose: medication.dose,
                  frequency: medication.frequency,
                  isNew: consultationPrescription.isNew,
                })
                .from(consultationPrescription)
                .innerJoin(medication, eq(consultationPrescription.medicationId, medication.id))
                .where(inArray(consultationPrescription.consultationId, consultationIds)),
            ])
          : [[], []];

      // ── Build lookup maps by patientId / userId ─────────────────────────
      const historyByUserId = new Map(histories.map((h) => [h.userId, h]));
      const allergiesByUserId = this.groupBy(allergies, (a) => String(a.userId));
      const familyByUserId = this.groupBy(familyHistories, (f) => String(f.userId));
      const medsByUserId = this.groupBy(medications, (m) => String(m.userId));
      const vitalsByPid = this.limitGroupBy(vitals, (v) => v.patientId, 4);
      const consByPid = this.limitGroupBy(consultations, (c) => c.patientId, 4);
      const labsByPid = this.groupBy(labResults, (l) => l.patientId);
      const notesByPid = this.limitGroupBy(clinicalNotes, (n) => n.patientId, 5);
      const procsByPid = this.limitGroupBy(procedures, (p) => p.patientId, 4);
      const echoByPid = this.limitGroupBy(echoAnalyses, (e) => e.patientId, 2);
      const ecgByPid = this.limitGroupBy(ecgAnalyses, (e) => e.patientId, 2);
      const xrayByPid = this.limitGroupBy(xrayAnalyses, (x) => x.patientId, 2);
      const mriByPid = this.limitGroupBy(cineMriAnalyses, (m) => m.patientId, 2);
      const diagsByConsId = this.groupBy(diagnosesRows, (d) => d.consultationId);
      const rxsByConsId = this.groupBy(prescriptionsRows, (p) => p.consultationId);

      // ── Assemble compact roster first ───────────────────────────────────
      const rosterLines: string[] = ['## Patient Roster (all accessible patients)'];
      for (const p of patientRows) {
        const age = this.computeAge(p.dateOfBirth);
        const cons = consByPid.get(p.id) ?? [];
        const lastVisit = cons[0]?.completedAt ?? cons[0]?.startedAt;
        const diags = cons.length > 0
          ? (diagsByConsId.get(cons[0].id) ?? []).map((d) => d.description).join(', ')
          : '';
        rosterLines.push(
          `${p.patientNumber} | ${p.name} | ${age}${p.gender ? p.gender[0].toUpperCase() : ''} | risk:${p.riskLevel} | ${diags || 'no diagnoses'} | last visit:${lastVisit ? this.formatDate(lastVisit) : 'none'}`,
        );
      }

      // ── Assemble detailed records ────────────────────────────────────────
      const detailSections: string[] = [];
      for (const p of patientRows) {
        const age = this.computeAge(p.dateOfBirth);
        const historyRow = historyByUserId.get(p.userId);
        const patAllergies = allergiesByUserId.get(String(p.userId)) ?? [];
        const patFamily = familyByUserId.get(String(p.userId)) ?? [];
        const patMeds = medsByUserId.get(String(p.userId)) ?? [];
        const patVitals = vitalsByPid.get(p.id) ?? [];
        const patCons = consByPid.get(p.id) ?? [];
        const patLabs = labsByPid.get(p.id) ?? [];
        const patNotes = notesByPid.get(p.id) ?? [];
        const patProcs = procsByPid.get(p.id) ?? [];
        const patEcho = echoByPid.get(p.id) ?? [];
        const patEcg = ecgByPid.get(p.id) ?? [];
        const patXray = xrayByPid.get(p.id) ?? [];
        const patMri = mriByPid.get(p.id) ?? [];

        const lines: string[] = [`\n=== Patient: ${p.name} (${p.patientNumber}) ===`];

        // Profile
        const profileParts = [
          `Age: ${age}`,
          `Gender: ${p.gender}`,
          p.bloodType ? `Blood type: ${p.bloodType}` : null,
          p.heightCm ? `Height: ${p.heightCm} cm` : null,
          p.weightKg ? `Weight: ${p.weightKg} kg` : null,
          p.bmi ? `BMI: ${p.bmi}` : null,
          p.smokingStatus ? `Smoking: ${p.smokingStatus}` : null,
          p.alcoholConsumption ? `Alcohol: ${p.alcoholConsumption}` : null,
          p.dietaryHabits ? `Diet: ${p.dietaryHabits}` : null,
          `Risk: ${p.riskLevel}`,
        ].filter(Boolean).join(' | ');
        lines.push(`Profile: ${profileParts}`);
        if (p.aiRegistrationSummary?.trim()) {
          lines.push(`AI Registration Summary: ${p.aiRegistrationSummary.trim().slice(0, 400)}`);
        }

        // Medical history
        if (historyRow) {
          const hLines: string[] = [];
          if (historyRow.chiefComplaint) {
            hLines.push(historyRow.chiefComplaint === 'other' && historyRow.chiefComplaintOtherText
              ? historyRow.chiefComplaintOtherText
              : historyRow.chiefComplaint);
          }
          if (!historyRow.noCardiacHistory && historyRow.pastCardiacHistory) {
            hLines.push(`Cardiac hx: ${this.jsonToText(historyRow.pastCardiacHistory).slice(0, 200)}`);
          }
          if (!historyRow.noNonCardiacHistory && historyRow.pastNonCardiacHistory) {
            hLines.push(`Non-cardiac hx: ${this.jsonToText(historyRow.pastNonCardiacHistory).slice(0, 200)}`);
          }
          if (historyRow.cardiovascularRiskFactors) {
            hLines.push(`CVD risks: ${this.jsonToText(historyRow.cardiovascularRiskFactors).slice(0, 200)}`);
          }
          if (historyRow.medicalHistoryNotes?.trim()) {
            hLines.push(`Notes: ${historyRow.medicalHistoryNotes.trim().slice(0, 300)}`);
          }
          if (hLines.length > 0) lines.push(`Medical history: ${hLines.join(' · ')}`);
        }

        // Allergies
        if (patAllergies.length > 0) {
          lines.push(`Allergies: ${patAllergies.map((a) => `${a.allergen}(${a.category}${a.reaction ? '→' + a.reaction : ''})`).join('; ')}`);
        }

        // Family history
        if (patFamily.length > 0) {
          lines.push(`Family history: ${patFamily.map((f) => `${f.relationship}: ${f.condition}`).join('; ')}`);
        }

        // Medications
        if (patMeds.length > 0) {
          const activeMeds = patMeds.filter((m) => m.status === 'active');
          const otherMeds = patMeds.filter((m) => m.status !== 'active');
          if (activeMeds.length > 0) {
            lines.push(`Active medications:`);
            for (const m of activeMeds) {
              const compliance = m.compliance ? ` [${m.compliance} compliance]` : '';
              const end = m.endDate ? ` until ${this.formatDate(m.endDate)}` : '';
              lines.push(`  - ${m.name} ${m.dose} ${m.frequency}${compliance}${end}`);
            }
          }
          if (otherMeds.length > 0) {
            lines.push(`  Paused/discontinued: ${otherMeds.map((m) => `${m.name}[${m.status}]`).join(', ')}`);
          }
        }

        // Recent vitals
        if (patVitals.length > 0) {
          lines.push(`Recent vitals:`);
          for (const v of patVitals) {
            const parts: string[] = [`[${this.formatDate(v.date)}]`];
            if (v.systolicBp != null && v.diastolicBp != null) parts.push(`BP ${v.systolicBp}/${v.diastolicBp}`);
            if (v.heartRate != null) parts.push(`HR ${v.heartRate}`);
            if (v.oxygenSaturation != null) parts.push(`SpO2 ${v.oxygenSaturation}%`);
            if (v.weight != null) parts.push(`Wt ${v.weight}kg`);
            if (v.bloodSugar != null) parts.push(`Glu ${v.bloodSugar}`);
            if (v.temperature != null) parts.push(`T ${v.temperature}°C`);
            lines.push(`  ${parts.join(' | ')}`);
          }
        }

        // Consultations
        if (patCons.length > 0) {
          lines.push(`Consultations (last ${patCons.length}):`);
          for (const c of patCons) {
            const date = this.formatDate(c.completedAt ?? c.startedAt);
            const consLines = [`  [${date}] ${c.visitType} — Dr. ${c.doctorName}`];
            if (c.chiefComplaint?.trim()) consLines.push(`    Complaint: ${c.chiefComplaint.trim()}`);
            if (c.historyOfPresentIllness?.trim())
              consLines.push(`    HPI: ${c.historyOfPresentIllness.trim().slice(0, 200)}`);
            const diags = diagsByConsId.get(c.id) ?? [];
            if (diags.length > 0) {
              consLines.push(`    Diagnoses: ${diags.map((d) => `${d.description}[${d.icdCode}](${d.type},${d.severity}${d.chronicFlag ? ',chronic' : ''})`).join('; ')}`);
            }
            const rxs = rxsByConsId.get(c.id) ?? [];
            if (rxs.length > 0) {
              consLines.push(`    Prescribed: ${rxs.map((r) => `${r.name} ${r.dose}${r.isNew ? '[new]' : ''}`).join('; ')}`);
            }
            if (c.plan?.trim()) consLines.push(`    Plan: ${c.plan.trim().slice(0, 300)}`);
            if (c.notes?.trim()) consLines.push(`    Notes: ${c.notes.trim().slice(0, 200)}`);
            if (c.followUpInstructions?.trim()) consLines.push(`    Follow-up: ${c.followUpInstructions.trim()}`);
            lines.push(...consLines);
          }
        }

        // Lab results
        if (patLabs.length > 0) {
          const deduped = this.dedupeLabsByTestName(patLabs);
          lines.push(`Lab results:`);
          for (const lr of deduped) {
            const val = lr.unit?.trim() ? `${lr.value} ${lr.unit}` : lr.value;
            lines.push(`  - ${lr.testName}: ${val} [${lr.status}] ${this.formatDate(lr.resultAt)}`);
          }
        }

        // Clinical / AI notes
        if (patNotes.length > 0) {
          lines.push(`Clinical notes:`);
          for (const note of patNotes) {
            lines.push(`  [${this.formatDate(note.createdAt)}] ${note.body.trim().slice(0, 300)}`);
          }
        }

        // Procedures
        if (patProcs.length > 0) {
          lines.push(`Procedures:`);
          for (const proc of patProcs) {
            const scheduled = proc.scheduledAt ? ` scheduled:${this.formatDate(proc.scheduledAt)}` : '';
            lines.push(`  - ${proc.procedureName} [${proc.status}/${proc.priority}]${scheduled} ${proc.department}`);
            if (proc.notes?.trim()) lines.push(`    Notes: ${proc.notes.trim().slice(0, 150)}`);
          }
        }

        // AI analyses
        const aiLines: string[] = [];
        if (patEcho.length > 0) {
          for (const e of patEcho) {
            const report = e.aiReport?.trim();
            if (report) aiLines.push(`  Echo AI [${this.formatDate(e.createdAt)}]: ${report.slice(0, 500)}`);
          }
        }
        if (patEcg.length > 0) {
          for (const e of patEcg) {
            const summary = this.extractEcgSummary(e.aiReportJson);
            if (summary) aiLines.push(`  ECG AI [${this.formatDate(e.createdAt)}]: ${summary}`);
          }
        }
        if (patXray.length > 0) {
          for (const x of patXray) {
            const summary = this.extractXraySummary(x.analysisJson, x.riskLevel);
            if (summary) aiLines.push(`  X-ray AI [${this.formatDate(x.createdAt)}]: risk:${x.riskLevel} — ${summary}`);
          }
        }
        if (patMri.length > 0) {
          for (const m of patMri) {
            const summary = this.extractMriSummary(m.analysisJson, m.diagnosisClass);
            if (summary) aiLines.push(`  Cine-MRI AI [${this.formatDate(m.createdAt)}]: class:${m.diagnosisClass} — ${summary}`);
          }
        }
        if (aiLines.length > 0) {
          lines.push('AI analysis results:');
          lines.push(...aiLines);
        }

        detailSections.push(lines.join('\n'));
      }

      const header = [
        `=== DOCTOR PATIENT PANEL (live — your patients only) ===`,
        `Doctor ID: ${doctorId} | Total accessible patients: ${patientRows.length}`,
        '',
        rosterLines.join('\n'),
        '',
        '=== DETAILED PATIENT RECORDS ===',
      ];

      return [...header, ...detailSections, '\n=== END PATIENT PANEL ==='].join('\n');
    } catch (err) {
      this.logger.warn('DoctorPatientContextService.build failed', err);
      return '';
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private async getAccessiblePatientIds(doctorId: string): Promise<string[]> {
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

  private computeAge(dateOfBirth: Date | string): number {
    const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
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

  private jsonToText(data: unknown): string {
    if (!data) return '';
    if (typeof data === 'string') return data;
    try {
      const obj = typeof data === 'object' ? data : JSON.parse(String(data));
      if (Array.isArray(obj)) return obj.join(', ');
      return Object.entries(obj as Record<string, unknown>)
        .filter(([, v]) => v !== null && v !== undefined && v !== '' && v !== false)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
        .join('; ');
    } catch {
      return String(data);
    }
  }

  private extractEcgSummary(reportJson: string | null | undefined): string {
    if (!reportJson?.trim()) return '';
    try {
      const parsed = JSON.parse(reportJson) as Record<string, unknown>;
      const parts: string[] = [];
      if (parsed.diagnosis) parts.push(String(parsed.diagnosis));
      if (parsed.rhythm) parts.push(`rhythm: ${parsed.rhythm}`);
      if (parsed.findings) parts.push(`findings: ${Array.isArray(parsed.findings) ? parsed.findings.slice(0, 3).join(', ') : String(parsed.findings)}`);
      if (parsed.interpretation) parts.push(String(parsed.interpretation).slice(0, 200));
      return parts.join(' | ').slice(0, 400);
    } catch {
      return reportJson.trim().slice(0, 400);
    }
  }

  private extractXraySummary(analysisJson: string, riskLevel: string): string {
    try {
      const parsed = JSON.parse(analysisJson) as Record<string, unknown>;
      const parts: string[] = [];
      if (parsed.findings) parts.push(Array.isArray(parsed.findings) ? parsed.findings.slice(0, 3).join(', ') : String(parsed.findings).slice(0, 200));
      if (parsed.impression) parts.push(String(parsed.impression).slice(0, 200));
      if (parsed.diagnosis) parts.push(String(parsed.diagnosis).slice(0, 100));
      return parts.join(' | ').slice(0, 400) || `risk level: ${riskLevel}`;
    } catch {
      return `risk level: ${riskLevel}`;
    }
  }

  private extractMriSummary(analysisJson: string, diagnosisClass: string): string {
    try {
      const parsed = JSON.parse(analysisJson) as Record<string, unknown>;
      const parts: string[] = [`class: ${diagnosisClass}`];
      if (parsed.ef !== undefined) parts.push(`EF: ${parsed.ef}%`);
      if (parsed.edv !== undefined) parts.push(`EDV: ${parsed.edv}ml`);
      if (parsed.esv !== undefined) parts.push(`ESV: ${parsed.esv}ml`);
      if (parsed.sv !== undefined) parts.push(`SV: ${parsed.sv}ml`);
      if (parsed.interpretation) parts.push(String(parsed.interpretation).slice(0, 200));
      return parts.join(' | ').slice(0, 400);
    } catch {
      return `class: ${diagnosisClass}`;
    }
  }

  private dedupeLabsByTestName<T extends { testName: string; resultAt: Date }>(rows: T[]): T[] {
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

  /** Like groupBy but keeps only the first `limit` entries per key (order from DB is desc). */
  private limitGroupBy<T>(arr: T[], keyFn: (item: T) => string, limit: number): Map<string, T[]> {
    const map = new Map<string, T[]>();
    for (const item of arr) {
      const k = keyFn(item);
      const existing = map.get(k);
      if (!existing) {
        map.set(k, [item]);
      } else if (existing.length < limit) {
        existing.push(item);
      }
    }
    return map;
  }
}
