import type { LucideIcon } from "lucide-react"

export type VitalSummaryCardStatus = "normal" | "critical" | "warning"

export type VitalSummaryCard = {
  label: string
  value: string
  unit: string
  icon: LucideIcon
  iconClass: string
  status: VitalSummaryCardStatus
}

export type AssistantPatientSummary = {
  id: string
  name: string
  age: number
  gender: string
  mrn: string
  phone: string
  email: string
  address: string
  maritalStatus: string
  occupation: string
  dateAdded: string
  condition: string
  status: string
  riskLevel: string
  bloodType: string
  lastVisitDate: string
  lastVisitType: string
  primaryDoctor: string
  emergencyContact: { name: string; relation: string; phone: string }
  insurance: { provider: string; policyNumber: string }
  height: string
  weight: string
  bmi: string
  allergies: string[]
  lifestyle: {
    smoking: { status: string; detail: string; color: string }
    exercise: { status: string; detail: string; color: string }
    diet: { status: string; detail: string; color: string }
    alcohol: { status: string; detail: string; color: string }
    sleep: { status: string; detail: string; color: string }
    stress: { status: string; detail: string; color: string }
  }
  adherence: number
  riskScore: number
}

export type PastMedicationRow = {
  id: string
  name: string
  strength: string
  kind: "discontinued" | "completed"
  endedOn: string
  note: string
}

export type ActiveMedicationAssistant = {
  id: string
  name: string
  strength: string
  frequencyLabel: string
  timesOfDay: string[]
  withFood: string
  instructionPatient: string
  adherencePct: number
  adherenceBarClass: string
  adherenceTextClass: string
  supply: { variant: "warning" | "ok"; label: string }
  Icon: LucideIcon
  details: {
    prescriber: string
    startedOn: string
    sigSummary: string
    quantity: string
    refillsRemaining: number
  }
}

export type AssistantAppointmentVisitMode = "video" | "in_clinic"

export type AssistantAppointmentRow = {
  id: string
  date: string
  time: string
  doctor: {
    name: string
    department: string
    avatar: string
  }
  status: string
  type: string
  visitMode: AssistantAppointmentVisitMode
  bookedBy: string
}

export type AssistantVitalsHistoryRow = {
  id: string
  date: string
  time: string
  bp: string
  hr: string
  temp: string
  spo2: string
  weight: string
  glucose: string
  takenBy: string
}

export type AssistantVitalsTrendPoint = {
  month: string
  systolic: number
  diastolic: number
}

export type AssistantVisitHistoryTag = {
  label: string
  icon: LucideIcon
  color: string
}

export type AssistantVisitHistoryRow = {
  id: string
  date: string
  timeAgo: string
  year: string
  type: string
  doctor: {
    name: string
    avatar: string
    department: string
  }
  summary: string
  tags: AssistantVisitHistoryTag[]
  status: string
}

export type AssistantLabTestRow = {
  name: string
  value: string
  unit: string
  range: string
  status: string
}

export type AssistantLabReportRow = {
  id: string
  date: string
  title: string
  category: string
  doctor: {
    name: string
    avatar: string
    department: string
  }
  tests: AssistantLabTestRow[]
}

export type AssistantPrescriptionMedRow = {
  name: string
  dosage: string
  frequency: string
  duration: string
  quantity: string
  instructions: string
}

export type AssistantPrescriptionRow = {
  id: string
  date: string
  status: string
  doctor: {
    name: string
    department: string
    avatar: string
  }
  medications: AssistantPrescriptionMedRow[]
}

export type AssistantPatientHubNavKey =
  | "profile"
  | "appointments"
  | "vitals"
  | "visit-history"
  | "lab-results"
  | "prescription"
  | "medical-history"
  | "documents"
  | "insurance"

export type AssistantPatientProfileTabId =
  | "overview"
  | "clinical-notes"
  | "lab-results"
  | "imaging"
  | "medications"
