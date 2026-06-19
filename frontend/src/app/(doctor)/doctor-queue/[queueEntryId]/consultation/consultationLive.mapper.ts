import type {
  ConsultationData,
  ConsultationMedicalHistory,
  ChiefComplaintStructured,
  DiagnosisEntry,
  HomeMeasurement,
  PhysicalExamFindings,
  PrescriptionEntry,
  ProcedureDetails,
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
    "stress_test",
    "cardiac_catheterization",
    "pulmonary_function",
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
    homeMeasurements: parseHomeMeasurements(consultation.homeMonitoring),
    clinicalNotes: consultation.notes ?? "",
    assessmentAndPlan: consultation.plan ?? "",
    followUpDate: consultation.followUpTimeframe ?? "",
    followUpNotes: consultation.followUpInstructions ?? "",
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
