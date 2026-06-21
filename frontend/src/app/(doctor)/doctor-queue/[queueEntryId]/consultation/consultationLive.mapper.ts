import type {
  ConsultationData,
  ConsultationMedicalHistory,
  ChiefComplaintStructured,
  DiagnosisEntry,
  HomeMeasurement,
  PhysicalExamFindings,
  PrescriptionEntry,
  ProcedureDetails,
  ReferralEntry,
  TestOrder,
} from "./consultation.types"
import type { ApiConsultationSession } from "./consultation.api"
import { parseChiefComplaintStructured } from "./consultationChiefComplaint.utils"

const EMPTY_PHYSICAL_EXAM: PhysicalExamFindings = {
  heartSounds: "",
  murmurs: "",
  jvp: "",
  peripheralEdema: "",
  lungAuscultation: "",
  additionalFindings: "",
}

const EMPTY_MEDICAL_HISTORY: ConsultationMedicalHistory = {
  noCardiacHistory: false,
  cardiacAnswers: {},
  cardiacNotes: "",
  cardiacReviewed: false,
  noNonCardiacHistory: false,
  nonCardiacAnswers: {},
  nonCardiacNotes: "",
  nonCardiacReviewed: false,
  noKnownAllergies: false,
  noChronicConditions: false,
}

const EMPTY_PROCEDURE_DETAILS: ProcedureDetails = {
  procedureType: "",
  surgicalSpecialty: "general_surgery",
  surgeryDate: "",
  startTime: "09:00",
  operatingRoom: "OR-1",
  anesthesiaType: "general",
  asaClassification: "ASA_I",
  estimatedDurationMin: 90,
  priority: "elective",
  clinicalNotes: "",
}

const DURATION_DAYS_TO_LABEL: Record<number, string> = {
  7: "1 week",
  14: "2 weeks",
  30: "1 month",
  90: "3 months",
  180: "6 months",
}

type LabOrderMeta = {
  testType?: TestOrder["testType"]
  location?: string
  scheduledDate?: string
  scheduledTime?: string
  fastingRequired?: boolean
  clinicalNotes?: string
}

function parseJsonObject<T extends object>(raw: string | null | undefined, fallback: T): T {
  if (!raw?.trim()) return fallback
  try {
    const parsed = JSON.parse(raw) as Partial<T>
    return { ...fallback, ...parsed }
  } catch {
    return fallback
  }
}

function mapDurationLabel(duration: string | null, durationDays: number | null): string {
  if (duration?.trim()) return duration
  if (durationDays == null) return "Ongoing"
  return DURATION_DAYS_TO_LABEL[durationDays] ?? `${durationDays} days`
}

function mapMedicalHistory(
  consultationRaw: string | null | undefined,
  patientHistory: ApiConsultationSession["patientHistory"],
): ConsultationMedicalHistory {
  const fromConsultation = parseJsonObject(consultationRaw, EMPTY_MEDICAL_HISTORY)
  if (consultationRaw?.trim()) return fromConsultation

  if (!patientHistory) return fromConsultation

  return {
    ...EMPTY_MEDICAL_HISTORY,
    noCardiacHistory: patientHistory.noCardiacHistory,
    cardiacAnswers: (patientHistory.pastCardiacHistory ?? {}) as Record<string, string>,
    noNonCardiacHistory: patientHistory.noNonCardiacHistory,
    nonCardiacAnswers: (patientHistory.pastNonCardiacHistory ?? {}) as Record<string, string>,
    nonCardiacNotes: patientHistory.medicalHistoryNotes ?? "",
  }
}

export function prescriptionDurationToDays(duration: string): number | null {
  switch (duration) {
    case "1 week":
      return 7
    case "2 weeks":
      return 14
    case "1 month":
      return 30
    case "3 months":
      return 90
    case "6 months":
      return 180
    default:
      return null
  }
}

function parsePhysicalExam(raw: string | null | undefined): PhysicalExamFindings {
  if (!raw?.trim()) return { ...EMPTY_PHYSICAL_EXAM }
  try {
    const parsed = JSON.parse(raw) as Partial<PhysicalExamFindings>
    return { ...EMPTY_PHYSICAL_EXAM, ...parsed }
  } catch {
    return {
      ...EMPTY_PHYSICAL_EXAM,
      additionalFindings: raw,
    }
  }
}

function parseHomeMeasurements(raw: string | null | undefined): HomeMeasurement[] {
  if (!raw?.trim()) return []
  try {
    const parsed = JSON.parse(raw) as HomeMeasurement[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function parseLabOrderMeta(notes: string | null | undefined): LabOrderMeta {
  if (!notes?.trim()) return {}
  try {
    return JSON.parse(notes) as LabOrderMeta
  } catch {
    return { clinicalNotes: notes }
  }
}

function mapTestType(value: string | null | undefined): TestOrder["testType"] {
  const allowed: TestOrder["testType"][] = [
    "blood",
    "imaging",
    "ecg",
    "echocardiogram",
    "holter_monitor",
    "stress_test",
    "nuclear_stress_test",
    "ct_coronary_angiography",
    "cardiac_mri",
    "cardiac_catheterization",
    "carotid_doppler",
    "tilt_table_test",
    "pulmonary_function",
    "sleep_study",
    "urinalysis",
    "other",
  ]
  if (value && allowed.includes(value as TestOrder["testType"])) {
    return value as TestOrder["testType"]
  }
  return "other"
}

export function mapSessionToLiveFields(
  session: ApiConsultationSession,
): Pick<
  ConsultationData,
  | "chiefComplaint"
  | "structuredComplaint"
  | "chiefComplaintStructured"
  | "medicalHistory"
  | "procedureDetails"
  | "prescriptions"
  | "physicalExam"
  | "diagnoses"
  | "testOrders"
  | "homeMeasurements"
  | "clinicalNotes"
  | "assessmentAndPlan"
  | "followUpDate"
  | "followUpNotes"
  | "patientDiagnosisSummary"
  | "patientLifestyleAdvice"
  | "patientDangerSigns"
> {
  const { consultation, diagnoses, labOrders, prescriptions } = session

  const mappedDiagnoses: DiagnosisEntry[] = diagnoses.map((row) => ({
    id: row.id,
    icdCode: row.icdCode,
    description: row.description,
    type: row.type,
    severity: row.severity,
    notes: row.notes ?? "",
    isAiSuggested: false,
  }))

  const mappedTestOrders: TestOrder[] = []
  for (const order of labOrders) {
    const meta = parseLabOrderMeta(order.notes)
    for (const item of order.items) {
      mappedTestOrders.push({
        id: order.id,
        testType: mapTestType(item.panel ?? meta.testType),
        testName: item.testName,
        urgency: order.priority,
        notes: meta.clinicalNotes ?? "",
        location: meta.location ?? "",
        scheduledDate: meta.scheduledDate ?? "",
        scheduledTime: meta.scheduledTime ?? "",
        fastingRequired: meta.fastingRequired ?? false,
      })
    }
  }

  const mappedPrescriptions: PrescriptionEntry[] = prescriptions.map((row) => ({
    id: row.medicationId,
    name: row.name,
    dose: row.dose,
    frequency: row.frequency,
    duration: mapDurationLabel(row.duration, row.durationDays),
    type: row.type,
    instructions: row.instructions ?? row.notes ?? "",
  }))

  const mappedReferrals: ReferralEntry[] = (session.referrals ?? []).map((row) => ({
    id: row.id,
    specialty: row.specialty,
    reason: row.reason,
    urgency: row.urgency,
  }))

  const chiefComplaintStructured = parseChiefComplaintStructured(
    consultation.chiefComplaintStructured,
    consultation.historyOfPresentIllness,
  )

  return {
    chiefComplaint: consultation.chiefComplaint ?? "",
    structuredComplaint: chiefComplaintStructured.primaryComplaint,
    chiefComplaintStructured,
    medicalHistory: mapMedicalHistory(
      consultation.consultationMedicalHistory,
      session.patientHistory,
    ),
    procedureDetails: parseJsonObject(
      consultation.consultationProcedureDetails,
      EMPTY_PROCEDURE_DETAILS,
    ),
    prescriptions: mappedPrescriptions,
    physicalExam: parsePhysicalExam(consultation.physicalExam),
    diagnoses: mappedDiagnoses,
    testOrders: mappedTestOrders,
    referrals: mappedReferrals,
    homeMeasurements: parseHomeMeasurements(consultation.homeMonitoring),
    clinicalNotes: consultation.notes ?? "",
    assessmentAndPlan: consultation.plan ?? "",
    followUpDate: consultation.followUpTimeframe ?? "",
    followUpNotes: consultation.followUpInstructions ?? "",
    patientDiagnosisSummary: consultation.patientDiagnosisSummary ?? "",
    patientLifestyleAdvice: consultation.patientLifestyleAdvice ?? "",
    patientDangerSigns: consultation.patientDangerSigns ?? "",
  }
}

export type ConsultationLiveFields = ReturnType<typeof mapSessionToLiveFields>

function pickTextField(server: string, local: string): string {
  const serverValue = server.trim()
  const localValue = local.trim()
  if (localValue && !serverValue) return local
  if (serverValue && !localValue) return server
  if (localValue && serverValue) return local
  return local
}

function pickStringArray(server: string[], local: string[]): string[] {
  if (local.length > 0 && server.length === 0) return local
  if (server.length > 0 && local.length === 0) return server
  if (local.length > 0 && server.length > 0) return local
  return local
}

function pickBoolean(server: boolean, local: boolean): boolean {
  if (local && !server) return true
  if (!local && server) return server
  return local
}

function mergeAnswerRecords(
  local: Record<string, string>,
  server: Record<string, string>,
): Record<string, string> {
  const keys = new Set([...Object.keys(local), ...Object.keys(server)])
  const merged: Record<string, string> = {}
  for (const key of keys) {
    merged[key] = pickTextField(server[key] ?? "", local[key] ?? "")
  }
  return merged
}

export function mergeMedicalHistory(
  local: ConsultationMedicalHistory,
  server: ConsultationMedicalHistory,
): ConsultationMedicalHistory {
  return {
    noCardiacHistory: pickBoolean(server.noCardiacHistory, local.noCardiacHistory),
    cardiacAnswers: mergeAnswerRecords(local.cardiacAnswers, server.cardiacAnswers),
    cardiacNotes: pickTextField(server.cardiacNotes, local.cardiacNotes),
    cardiacReviewed: pickBoolean(server.cardiacReviewed, local.cardiacReviewed),
    noNonCardiacHistory: pickBoolean(server.noNonCardiacHistory, local.noNonCardiacHistory),
    nonCardiacAnswers: mergeAnswerRecords(local.nonCardiacAnswers, server.nonCardiacAnswers),
    nonCardiacNotes: pickTextField(server.nonCardiacNotes, local.nonCardiacNotes),
    nonCardiacReviewed: pickBoolean(server.nonCardiacReviewed, local.nonCardiacReviewed),
    noKnownAllergies: pickBoolean(server.noKnownAllergies, local.noKnownAllergies),
    noChronicConditions: pickBoolean(server.noChronicConditions, local.noChronicConditions),
  }
}

export function mergeChiefComplaintStructured(
  local: ChiefComplaintStructured,
  server: ChiefComplaintStructured,
): ChiefComplaintStructured {
  return {
    primaryComplaint: pickTextField(server.primaryComplaint, local.primaryComplaint),
    onset: pickTextField(server.onset, local.onset),
    duration: pickTextField(server.duration, local.duration),
    severity: pickTextField(server.severity, local.severity),
    character: pickTextField(server.character, local.character),
    aggravating: pickStringArray(server.aggravating, local.aggravating),
    relieving: pickStringArray(server.relieving, local.relieving),
    associatedSymptoms: pickStringArray(server.associatedSymptoms, local.associatedSymptoms),
    otherComplaintDetail: pickTextField(server.otherComplaintDetail, local.otherComplaintDetail),
  }
}

export function mergePhysicalExamFields(
  local: PhysicalExamFindings,
  server: PhysicalExamFindings,
): PhysicalExamFindings {
  return {
    heartSounds: pickTextField(server.heartSounds, local.heartSounds),
    murmurs: pickTextField(server.murmurs, local.murmurs),
    jvp: pickTextField(server.jvp, local.jvp),
    peripheralEdema: pickTextField(server.peripheralEdema, local.peripheralEdema),
    lungAuscultation: pickTextField(server.lungAuscultation, local.lungAuscultation),
    additionalFindings: pickTextField(server.additionalFindings, local.additionalFindings),
  }
}

export function mergeSessionLiveFields(
  prev: ConsultationData,
  live: ConsultationLiveFields,
): ConsultationData {
  const chiefComplaintStructured = mergeChiefComplaintStructured(
    prev.chiefComplaintStructured,
    live.chiefComplaintStructured,
  )
  const medicalHistory = mergeMedicalHistory(prev.medicalHistory, live.medicalHistory)

  return {
    ...prev,
    ...live,
    chiefComplaint: pickTextField(live.chiefComplaint, prev.chiefComplaint),
    chiefComplaintStructured,
    structuredComplaint: pickTextField(
      live.structuredComplaint,
      prev.structuredComplaint || chiefComplaintStructured.primaryComplaint,
    ),
    medicalHistory,
    clinicalNotes: pickTextField(live.clinicalNotes, prev.clinicalNotes),
    assessmentAndPlan: pickTextField(live.assessmentAndPlan, prev.assessmentAndPlan),
    followUpDate: pickTextField(live.followUpDate, prev.followUpDate),
    followUpNotes: pickTextField(live.followUpNotes, prev.followUpNotes),
    patientDiagnosisSummary: pickTextField(live.patientDiagnosisSummary, prev.patientDiagnosisSummary),
    patientLifestyleAdvice: pickTextField(live.patientLifestyleAdvice, prev.patientLifestyleAdvice),
    patientDangerSigns: pickTextField(live.patientDangerSigns, prev.patientDangerSigns),
    physicalExam: mergePhysicalExamFields(prev.physicalExam, live.physicalExam),
  }
}

export function buildLabOrderPayload(
  order: TestOrder,
  appointmentId: string,
): {
  appointmentId: string
  priority: TestOrder["urgency"]
  notes: string
  items: Array<{ testName: string; panel?: string }>
} {
  const meta: LabOrderMeta = {
    testType: order.testType,
    location: order.location,
    scheduledDate: order.scheduledDate,
    scheduledTime: order.scheduledTime,
    fastingRequired: order.fastingRequired,
    clinicalNotes: order.notes,
  }

  return {
    appointmentId,
    priority: order.urgency,
    notes: JSON.stringify(meta),
    items: [{ testName: order.testName, panel: order.testType }],
  }
}
