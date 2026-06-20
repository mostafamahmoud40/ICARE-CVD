import type { ConsultationReport } from "./doctorPatients.types"
import { REPORT_EMPTY_MESSAGES } from "@/lib/consultation-report.mapper"

export type ConsultationReportDraft = {
  chiefComplaint: string
  historyOfPresentIllness: string
  physicalExam: string
  clinicalNotes: string
  assessmentAndPlan: string
  medicalHistorySummary: string
  procedureDetailsSummary: string
  patientDiagnosisSummary: string
  patientLifestyleAdvice: string
  patientDangerSigns: string
  followUpTimeframe: string
  followUpInstructions: string
  aiStudies: Array<{
    id: string
    modality: string
    title: string
    fileName: string | null
    summary: string
    details: string
    hidden: boolean
  }>
}

export function reportDraftFromConsultation(report: ConsultationReport): ConsultationReportDraft {
  return {
    chiefComplaint: report.chiefComplaint,
    historyOfPresentIllness: report.historyOfPresentIllness,
    physicalExam: report.physicalExam,
    clinicalNotes: report.clinicalNotes,
    assessmentAndPlan: report.assessmentAndPlan,
    medicalHistorySummary: report.medicalHistorySummary,
    procedureDetailsSummary: report.procedureDetailsSummary,
    patientDiagnosisSummary: report.patientInstructions.diagnosisSummary,
    patientLifestyleAdvice: report.patientInstructions.lifestyleAdvice,
    patientDangerSigns: report.patientInstructions.dangerSigns,
    followUpTimeframe: report.followUp.timeframe,
    followUpInstructions: report.followUp.instructions,
    aiStudies: report.aiStudies.map((study, index) => ({
      id: study.id || `${study.modality}-${index}`,
      modality: study.modality,
      title: study.title,
      fileName: study.fileName,
      summary: study.summary,
      details: study.details ?? "",
      hidden: false,
    })),
  }
}

function normalizeReportField(value: string, emptyMessage: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed || trimmed === emptyMessage) return undefined
  return trimmed
}

export function buildConsultationReportPatch(draft: ConsultationReportDraft) {
  const reportOverrides = JSON.stringify({
    medicalHistorySummary: normalizeReportField(
      draft.medicalHistorySummary,
      REPORT_EMPTY_MESSAGES.medicalHistorySummary,
    ),
    procedureDetailsSummary: normalizeReportField(
      draft.procedureDetailsSummary,
      REPORT_EMPTY_MESSAGES.procedureDetailsSummary,
    ),
    aiStudies: Object.fromEntries(
      draft.aiStudies.map((study) => [
        study.id,
        study.hidden
          ? { hidden: true }
          : {
              title: study.title.trim() || undefined,
              summary: study.summary.trim(),
              details: study.details.trim() ? study.details.trim() : null,
            },
      ]),
    ),
  })

  return {
    chiefComplaint: normalizeReportField(
      draft.chiefComplaint,
      REPORT_EMPTY_MESSAGES.chiefComplaint,
    ),
    historyOfPresentIllness: normalizeReportField(
      draft.historyOfPresentIllness,
      REPORT_EMPTY_MESSAGES.historyOfPresentIllness,
    ),
    physicalExam: normalizeReportField(
      draft.physicalExam,
      REPORT_EMPTY_MESSAGES.physicalExam,
    ),
    notes: normalizeReportField(draft.clinicalNotes, REPORT_EMPTY_MESSAGES.clinicalNotes),
    plan: normalizeReportField(
      draft.assessmentAndPlan,
      REPORT_EMPTY_MESSAGES.assessmentAndPlan,
    ),
    patientDiagnosisSummary: normalizeReportField(
      draft.patientDiagnosisSummary,
      REPORT_EMPTY_MESSAGES.patientDiagnosisSummary,
    ),
    patientLifestyleAdvice: normalizeReportField(
      draft.patientLifestyleAdvice,
      REPORT_EMPTY_MESSAGES.patientLifestyleAdvice,
    ),
    patientDangerSigns: normalizeReportField(
      draft.patientDangerSigns,
      REPORT_EMPTY_MESSAGES.patientDangerSigns,
    ),
    followUpTimeframe: normalizeReportField(
      draft.followUpTimeframe,
      REPORT_EMPTY_MESSAGES.followUpTimeframe,
    ),
    followUpInstructions: normalizeReportField(
      draft.followUpInstructions,
      REPORT_EMPTY_MESSAGES.followUpInstructions,
    ),
    reportOverrides,
  }
}
