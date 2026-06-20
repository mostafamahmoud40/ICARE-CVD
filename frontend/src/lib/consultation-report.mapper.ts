import type { ConsultationReport, ConsultationVitals, VisitRecord } from "@/app/(doctor)/doctor-patients/doctorPatients.types"
import type {
  ClinicalOrder,
  ConsultationRecordStatus,
  ConsultationVisitType,
  DiagnosisTag,
  Medication,
  VisitSummary,
} from "@/app/(patient)/consultations/consultations.types"

export const REPORT_EMPTY_MESSAGES = {
  clinicalNotes: "No clinical notes were recorded for this visit.",
  chiefComplaint: "No chief complaint was documented for this visit.",
  historyOfPresentIllness: "No history of present illness was documented for this visit.",
  physicalExam: "No physical examination findings were documented for this visit.",
  plan: "No treatment plan or instructions were recorded for this visit.",
  additionalNotes: "No additional clinical notes were recorded for this visit.",
  followUpTimeframe: "Not scheduled",
  followUpInstructions: "No follow-up instructions were provided for this visit.",
  patientDiagnosisSummary: "No patient-friendly diagnosis summary was recorded for this visit.",
  patientLifestyleAdvice: "No lifestyle or diet guidance was recorded for this visit.",
  patientDangerSigns: "No emergency warning signs were documented for this visit.",
  reasonForVisit: "No reason for visit was recorded for this visit.",
  assessmentAndPlan: "No assessment or internal plan was recorded for this visit.",
  medicalHistorySummary: "No consultation medical history snapshot was recorded for this visit.",
  procedureDetailsSummary: "No procedure details were recorded for this visit.",
  homeMeasurements: "No home monitoring instructions were recorded for this visit.",
  testOrders: "No tests or imaging orders were placed during this visit.",
  aiStudies: "No AI analyses or session uploads were recorded for this visit.",
  vitalNotRecorded: "Not recorded at this visit",
} as const

export type ApiConsultationReport = {
  visitId: string
  patientId: string
  status: string
  date: string
  time: string
  doctorName: string
  doctorSpecialty: string
  type: string
  consultationVisitMode: ConsultationVisitType
  durationMin: number | null
  chiefComplaint: string | null
  historyOfPresentIllness: string | null
  chiefComplaintStructured: string | null
  physicalExam: string | null
  plan: string | null
  notes: string | null
  homeMonitoring: string | null
  patientDiagnosisSummary: string | null
  patientLifestyleAdvice: string | null
  patientDangerSigns: string | null
  followUp: {
    timeframe: string | null
    instructions: string | null
  }
  vitals: {
    systolicBP: number | null
    diastolicBP: number | null
    heartRate: number | null
    oxygenSaturation: number | null
    temperature: number | null
    weight: number | null
    bloodSugar: number | null
    respiratoryRate: number | null
    heightCm: number | null
  } | null
  diagnoses: Array<{
    id: string
    icdCode: string
    description: string
    type: "primary" | "secondary" | "differential"
    severity: string | null
    notes: string | null
  }>
  prescriptions: Array<{
    id: string
    name: string
    dose: string
    frequency: string
    duration: string
    isNew: boolean
    notes: string | null
  }>
  labOrders: Array<{
    id: string
    orderId: string
    testName: string
  }>
  referrals: Array<{
    specialty: string
    reason: string
    urgency: "routine" | "urgent"
  }>
  recordStatus: ConsultationRecordStatus
  clinicalNotes?: string | null
  assessmentAndPlan?: string | null
  medicalHistorySummary?: string | null
  procedureDetailsSummary?: string | null
  homeMeasurements?: Array<{
    metric: string
    frequency: string
    notes: string | null
  }>
  testOrders?: Array<{
    id: string
    tests: string[]
    priority: string
    status: string
    notes: string | null
  }>
  aiStudies?: Array<{
    id: string
    modality: string
    title: string
    fileName: string | null
    summary: string
    details: string | null
    createdAt: string
  }>
}

export type ApiPatientConsultationListItem = {
  id: string
  scheduledAt: string
  visitType: ConsultationVisitType
  doctorName: string
  doctorSpecialty: string
  recordStatus: ConsultationRecordStatus
  visitTitle: string
}

export function reportTextOrEmpty(
  value: string | null | undefined,
  emptyMessage: string,
): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : emptyMessage
}

export function vitalDisplayValue(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—"
  return String(value)
}

export function formatBloodPressure(
  systolic: number | null | undefined,
  diastolic: number | null | undefined,
): string {
  if (systolic == null || diastolic == null) return "—"
  return `${systolic}/${diastolic}`
}

function normalizeVisitType(type: string): VisitRecord["type"] {
  const allowed: VisitRecord["type"][] = [
    "follow-up",
    "new",
    "walk-in",
    "post-procedure",
    "urgent",
  ]
  return allowed.includes(type as VisitRecord["type"])
    ? (type as VisitRecord["type"])
    : "follow-up"
}

function buildPatientReasonForVisit(api: ApiConsultationReport): string {
  if (api.chiefComplaintStructured) {
    try {
      const structured = JSON.parse(api.chiefComplaintStructured) as {
        primaryComplaint?: string
      }
      const primary = structured.primaryComplaint?.trim()
      if (primary) return formatChiefComplaintLabel(primary)
    } catch {
      // fall through
    }
  }

  if (api.historyOfPresentIllness?.trim()) {
    return formatChiefComplaintLabel(api.historyOfPresentIllness.trim())
  }

  if (api.chiefComplaint?.trim()) {
    const text = api.chiefComplaint.trim()
    const firstClause = text.split(/\.\s*(?=Onset:|Duration:|Severity:|Character:|Aggravating|Relieving|Associated)/i)[0]?.trim()
    if (firstClause) {
      return firstClause.replace(/^Patient presents with\s*/i, "").replace(/\.\s*$/, "").trim() || text
    }
    return text
  }

  return ""
}

const CHIEF_COMPLAINT_LABELS: Record<string, string> = {
  chest_pain: "Chest pain",
  dyspnea: "Shortness of breath",
  palpitations: "Palpitations",
  syncope: "Syncope / near-syncope",
  fatigue: "Fatigue",
  edema: "Peripheral edema",
  dizziness: "Dizziness",
  orthopnea: "Orthopnea",
  pnd: "Paroxysmal nocturnal dyspnea",
  claudication: "Claudication",
  diaphoresis: "Diaphoresis",
  nausea: "Nausea / vomiting",
  jaw_pain: "Jaw pain",
  arm_pain: "Arm pain",
  back_pain: "Back pain",
  epigastric_pain: "Epigastric pain",
  other: "Other concern",
}

function formatChiefComplaintLabel(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_")
  if (CHIEF_COMPLAINT_LABELS[normalized]) return CHIEF_COMPLAINT_LABELS[normalized]!
  if (value.includes("_")) {
    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }
  return value.trim()
}

function buildDoctorHistoryOfPresentIllness(api: ApiConsultationReport): string {
  if (api.chiefComplaint?.trim()) {
    const text = api.chiefComplaint.trim()
    if (text.length > 40 || /Onset:|Duration:|Severity:|Character:/i.test(text)) {
      return text
    }
  }

  if (api.chiefComplaintStructured) {
    try {
      const structured = JSON.parse(api.chiefComplaintStructured) as {
        primaryComplaint?: string
        onset?: string
        duration?: string
        severity?: string
        character?: string
        aggravating?: string[]
        relieving?: string[]
        associatedSymptoms?: string[]
        otherComplaintDetail?: string
      }
      const parts: string[] = []
      if (structured.primaryComplaint?.trim()) {
        parts.push(
          `Patient presents with ${formatChiefComplaintLabel(structured.primaryComplaint.trim()).toLowerCase()}`,
        )
      }
      if (structured.onset?.trim()) parts.push(`Onset: ${structured.onset.trim()}`)
      if (structured.duration?.trim()) parts.push(`Duration: ${structured.duration.trim()}`)
      if (structured.severity?.trim()) parts.push(`Severity: ${structured.severity.trim()}`)
      if (structured.character?.trim()) parts.push(`Character: ${structured.character.trim()}`)
      if (structured.aggravating?.length) {
        parts.push(`Aggravating factors: ${structured.aggravating.join(", ")}`)
      }
      if (structured.relieving?.length) {
        parts.push(`Relieving factors: ${structured.relieving.join(", ")}`)
      }
      if (structured.associatedSymptoms?.length) {
        parts.push(`Associated symptoms: ${structured.associatedSymptoms.join(", ")}`)
      }
      if (structured.otherComplaintDetail?.trim()) {
        parts.push(structured.otherComplaintDetail.trim())
      }
      if (parts.length > 0) return parts.join(". ")
    } catch {
      // fall through
    }
  }

  return buildHistoryOfPresentIllness(api)
}

function buildDoctorChiefComplaint(api: ApiConsultationReport): string {
  if (api.chiefComplaintStructured) {
    try {
      const structured = JSON.parse(api.chiefComplaintStructured) as {
        primaryComplaint?: string
      }
      if (structured.primaryComplaint?.trim()) {
        return formatChiefComplaintLabel(structured.primaryComplaint.trim())
      }
    } catch {
      // fall through
    }
  }
  if (api.historyOfPresentIllness?.trim()) {
    return formatChiefComplaintLabel(api.historyOfPresentIllness.trim())
  }
  if (api.chiefComplaint?.trim()) {
    const text = api.chiefComplaint.trim()
    const firstClause = text.split(/\.\s*(?=Onset:|Duration:|Severity:)/i)[0]?.trim()
    return firstClause?.replace(/^Patient presents with\s*/i, "").replace(/\.\s*$/, "").trim() || text
  }
  return ""
}

function buildHistoryOfPresentIllness(api: ApiConsultationReport): string {
  if (api.historyOfPresentIllness?.trim()) return api.historyOfPresentIllness.trim()
  if (api.chiefComplaintStructured) {
    try {
      const structured = JSON.parse(api.chiefComplaintStructured) as Record<string, unknown>
      const parts: string[] = []
      if (typeof structured.primaryComplaint === "string" && structured.primaryComplaint.trim()) {
        parts.push(structured.primaryComplaint.trim())
      }
      if (typeof structured.onset === "string" && structured.onset.trim()) {
        parts.push(`Onset: ${structured.onset.trim()}`)
      }
      if (typeof structured.duration === "string" && structured.duration.trim()) {
        parts.push(`Duration: ${structured.duration.trim()}`)
      }
      if (typeof structured.severity === "string" && structured.severity.trim()) {
        parts.push(`Severity: ${structured.severity.trim()}`)
      }
      if (parts.length > 0) return parts.join(". ")
    } catch {
      // fall through
    }
  }
  return ""
}

function mapVitalsForDoctorReport(
  vitals: ApiConsultationReport["vitals"],
): ConsultationVitals | null {
  if (!vitals) {
    return {
      systolicBP: null,
      diastolicBP: null,
      heartRate: null,
      oxygenSaturation: null,
      temperature: null,
      weight: null,
      bloodSugar: null,
    }
  }

  return {
    systolicBP: vitals.systolicBP,
    diastolicBP: vitals.diastolicBP,
    heartRate: vitals.heartRate,
    oxygenSaturation: vitals.oxygenSaturation,
    temperature: vitals.temperature,
    weight: vitals.weight,
    bloodSugar: vitals.bloodSugar,
  }
}

function inferBpStatus(
  systolic: number | null | undefined,
  diastolic: number | null | undefined,
): "normal" | "elevated" | "warning" | "critical" {
  if (systolic == null || diastolic == null) return "normal"
  if (systolic >= 180 || diastolic >= 120) return "critical"
  if (systolic >= 140 || diastolic >= 90) return "elevated"
  if (systolic >= 130 || diastolic >= 80) return "warning"
  return "normal"
}

function mapPatientVitals(api: ApiConsultationReport) {
  const vitals = api.vitals
  const bpStatus = inferBpStatus(vitals?.systolicBP, vitals?.diastolicBP)
  const notRecorded = REPORT_EMPTY_MESSAGES.vitalNotRecorded

  return [
    {
      label: "Blood pressure",
      value: formatBloodPressure(vitals?.systolicBP, vitals?.diastolicBP),
      unit: "",
      status: bpStatus,
      note:
        vitals?.systolicBP == null || vitals?.diastolicBP == null
          ? notRecorded
          : bpStatus === "normal"
            ? "Normal"
            : bpStatus === "elevated"
              ? "Elevated"
              : "High",
    },
    {
      label: "Heart rate",
      value: vitalDisplayValue(vitals?.heartRate),
      unit: vitals?.heartRate == null ? "" : "bpm",
      status: "normal" as const,
      note: vitals?.heartRate == null ? notRecorded : "Recorded at visit",
    },
    {
      label: "Weight",
      value: vitalDisplayValue(vitals?.weight),
      unit: vitals?.weight == null ? "" : "kg",
      status: "normal" as const,
      note: vitals?.weight == null ? notRecorded : "Recorded at visit",
    },
    {
      label: "SpO2",
      value: vitalDisplayValue(vitals?.oxygenSaturation),
      unit: vitals?.oxygenSaturation == null ? "" : "%",
      status: "normal" as const,
      note: vitals?.oxygenSaturation == null ? notRecorded : "Recorded at visit",
    },
    {
      label: "Temperature",
      value: vitalDisplayValue(vitals?.temperature),
      unit: vitals?.temperature == null ? "" : "°C",
      status: "normal" as const,
      note: vitals?.temperature == null ? notRecorded : "Recorded at visit",
    },
    {
      label: "Blood sugar",
      value: vitalDisplayValue(vitals?.bloodSugar),
      unit: vitals?.bloodSugar == null ? "" : "mg/dL",
      status: "normal" as const,
      note: vitals?.bloodSugar == null ? notRecorded : "Recorded at visit",
    },
  ]
}

function mapDiagnosisTags(api: ApiConsultationReport): DiagnosisTag[] {
  return api.diagnoses.map((diagnosis) => {
    let variant: DiagnosisTag["variant"] = "stable"
    if (diagnosis.type === "primary") variant = "urgency"
    if (diagnosis.severity === "severe" || diagnosis.severity === "critical") {
      variant = "critical"
    }
    return {
      label: diagnosis.description,
      variant,
    }
  })
}

function mapMedications(api: ApiConsultationReport): Medication[] {
  const icons: Medication["icon"][] = ["blue", "green", "yellow", "red"]
  return api.prescriptions.map((prescription, index) => ({
    name: prescription.name,
    dosage: prescription.dose,
    schedule: prescription.frequency,
    status: prescription.isNew ? "new" : "ongoing",
    note: prescription.notes ?? (prescription.isNew ? "Started at this visit" : undefined),
    icon: icons[index % icons.length]!,
  }))
}

function parseHomeMonitoringOrders(raw: string | null): ClinicalOrder[] {
  if (!raw?.trim()) return []
  try {
    const parsed = JSON.parse(raw) as Array<{
      id?: string
      metric?: string
      frequency?: string
      notes?: string
    }>
    if (!Array.isArray(parsed)) return []
    return parsed.map((entry, index) => ({
      id: entry.id ?? `hm-${index}`,
      kind: "self_care" as const,
      title: entry.metric
        ? `Monitor ${entry.metric.replace(/_/g, " ")}`
        : "Home monitoring",
      detail: [entry.frequency, entry.notes].filter(Boolean).join(" · ") || "As directed by your doctor",
      status: "pending" as const,
    }))
  } catch {
    return []
  }
}

function mapClinicalOrders(api: ApiConsultationReport): ClinicalOrder[] {
  const orders: ClinicalOrder[] = [
    ...parseHomeMonitoringOrders(api.homeMonitoring),
    ...api.labOrders.map((lab) => ({
      id: lab.id,
      kind: "lab" as const,
      title: lab.testName,
      detail: "Ordered during your consultation",
      status: "pending" as const,
    })),
    ...api.referrals.map((referral, index) => ({
      id: `ref-${index}`,
      kind: "referral" as const,
      title: `${referral.specialty} referral`,
      specialty: referral.specialty,
      detail: referral.reason,
      status: "pending" as const,
      urgency: referral.urgency,
    })),
  ]

  if (api.followUp.timeframe?.trim()) {
    orders.push({
      id: "follow-up",
      kind: "appointment",
      title: "Follow-up visit",
      detail: api.followUp.instructions?.trim() || "As discussed with your doctor",
      status: "scheduled",
      dueDate: api.followUp.timeframe.trim(),
    })
  }

  return orders
}

function buildDoctorNotes(api: ApiConsultationReport): string {
  const parts: string[] = []
  if (api.chiefComplaint?.trim()) parts.push(api.chiefComplaint.trim())
  const hpi = buildHistoryOfPresentIllness(api)
  if (hpi) parts.push(hpi)
  if (api.notes?.trim()) parts.push(api.notes.trim())
  if (api.plan?.trim()) parts.push(api.plan.trim())

  if (parts.length === 0) return REPORT_EMPTY_MESSAGES.clinicalNotes
  return parts.join("\n\n")
}

function buildDiagnosisDescription(api: ApiConsultationReport): string {
  if (api.patientDiagnosisSummary?.trim()) return api.patientDiagnosisSummary.trim()
  const primary = api.diagnoses.find((d) => d.type === "primary")
  if (primary?.notes?.trim()) return primary.notes.trim()
  if (primary) return `Primary diagnosis: ${primary.description}.`
  if (api.diagnoses.length > 0) {
    return `Diagnoses discussed: ${api.diagnoses.map((d) => d.description).join(", ")}.`
  }
  return "No formal diagnosis was recorded for this visit."
}

function mapPatientInstructions(api: ApiConsultationReport) {
  return {
    diagnosisSummary: reportTextOrEmpty(
      api.patientDiagnosisSummary,
      REPORT_EMPTY_MESSAGES.patientDiagnosisSummary,
    ),
    lifestyleAdvice: reportTextOrEmpty(
      api.patientLifestyleAdvice,
      REPORT_EMPTY_MESSAGES.patientLifestyleAdvice,
    ),
    dangerSigns: reportTextOrEmpty(
      api.patientDangerSigns,
      REPORT_EMPTY_MESSAGES.patientDangerSigns,
    ),
  }
}

export function mapApiReportToDoctorReport(api: ApiConsultationReport): ConsultationReport {
  const hpi = buildDoctorHistoryOfPresentIllness(api)
  const chiefComplaint = buildDoctorChiefComplaint(api)

  return {
    visitId: api.visitId,
    patientId: api.patientId,
    date: api.date,
    time: api.time,
    doctorName: api.doctorName,
    doctorSpecialty: api.doctorSpecialty,
    type: normalizeVisitType(api.type),
    durationMin: api.durationMin ?? 0,
    chiefComplaint: reportTextOrEmpty(chiefComplaint, REPORT_EMPTY_MESSAGES.chiefComplaint),
    historyOfPresentIllness: reportTextOrEmpty(
      hpi,
      REPORT_EMPTY_MESSAGES.historyOfPresentIllness,
    ),
    vitals: mapVitalsForDoctorReport(api.vitals),
    physicalExam: reportTextOrEmpty(api.physicalExam, REPORT_EMPTY_MESSAGES.physicalExam),
    diagnoses: api.diagnoses
      .filter((d) => d.type !== "differential")
      .map((d) => ({
        icdCode: d.icdCode,
        description: d.description,
        type: d.type === "secondary" ? "secondary" : "primary",
      })),
    prescriptions: api.prescriptions.map((p) => ({
      id: p.id,
      name: p.name,
      dose: p.dose,
      frequency: p.frequency,
      duration: p.duration,
      isNew: p.isNew,
    })),
    labOrders: api.labOrders.map((lab) => lab.testName),
    referrals: api.referrals,
    plan: reportTextOrEmpty(api.plan, REPORT_EMPTY_MESSAGES.plan),
    clinicalNotes: reportTextOrEmpty(
      api.clinicalNotes ?? api.notes,
      REPORT_EMPTY_MESSAGES.clinicalNotes,
    ),
    assessmentAndPlan: reportTextOrEmpty(
      api.assessmentAndPlan ?? api.plan,
      REPORT_EMPTY_MESSAGES.assessmentAndPlan,
    ),
    medicalHistorySummary: reportTextOrEmpty(
      api.medicalHistorySummary,
      REPORT_EMPTY_MESSAGES.medicalHistorySummary,
    ),
    procedureDetailsSummary: reportTextOrEmpty(
      api.procedureDetailsSummary,
      REPORT_EMPTY_MESSAGES.procedureDetailsSummary,
    ),
    homeMeasurements: api.homeMeasurements ?? [],
    sessionTestOrders: api.testOrders ?? [],
    aiStudies: api.aiStudies ?? [],
    followUp: {
      timeframe: reportTextOrEmpty(
        api.followUp.timeframe,
        REPORT_EMPTY_MESSAGES.followUpTimeframe,
      ),
      instructions: reportTextOrEmpty(
        api.followUp.instructions,
        REPORT_EMPTY_MESSAGES.followUpInstructions,
      ),
    },
    notes: reportTextOrEmpty(api.notes, REPORT_EMPTY_MESSAGES.additionalNotes),
    patientInstructions: mapPatientInstructions(api),
  }
}

export function mapApiListItemToVisitSummary(
  item: ApiPatientConsultationListItem,
): VisitSummary {
  return {
    id: item.id,
    scheduledAt: item.scheduledAt,
    visitType: item.visitType,
    visitTitle: item.visitTitle,
    doctor: {
      name: item.doctorName,
      specialty: item.doctorSpecialty,
    },
    recordStatus: item.recordStatus,
    vitals: [],
    doctorNotes: "",
    diagnosis: { tags: [], description: "" },
    medications: [],
    orders: [],
    previousVisits: [],
    reasonForVisit: "",
  }
}

export function mapApiReportToVisitSummary(
  api: ApiConsultationReport,
  previousVisits: VisitSummary["previousVisits"] = [],
): VisitSummary {
  return {
    id: api.visitId,
    scheduledAt: api.date,
    visitType: api.consultationVisitMode,
    visitTitle: api.doctorSpecialty ? `${api.doctorSpecialty} visit` : "Consultation visit",
    doctor: {
      name: api.doctorName,
      specialty: api.doctorSpecialty,
    },
    recordStatus: api.recordStatus,
    vitals: mapPatientVitals(api),
    doctorNotes: "",
    diagnosis: {
      tags: mapDiagnosisTags(api),
      description: buildDiagnosisDescription(api),
    },
    medications: mapMedications(api),
    orders: mapClinicalOrders(api),
    previousVisits,
    patientInstructions: mapPatientInstructions(api),
    reasonForVisit: reportTextOrEmpty(
      buildPatientReasonForVisit(api),
      REPORT_EMPTY_MESSAGES.reasonForVisit,
    ),
  }
}
