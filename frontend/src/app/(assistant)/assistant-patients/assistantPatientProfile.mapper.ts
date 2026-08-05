import {
  DropletsIcon,
  GaugeIcon,
  HeartPulseIcon,
  ScaleIcon,
  ThermometerIcon,
  WindIcon,
} from "lucide-react"

import type {
  AssistantAppointmentRow,
  AssistantLabReportRow,
  AssistantPatientSummary,
  AssistantPrescriptionMedRow,
  AssistantPrescriptionRow,
  AssistantVitalsHistoryRow,
  AssistantVitalsTrendPoint,
  AssistantVisitHistoryRow,
  VitalSummaryCard,
} from "./[patientId]/assistantPatientProfile.types"
import type {
  AssistantAppointmentApiRow,
  AssistantPatientRecordResponse,
} from "./assistantPatientProfile.api"
import type { CreatedPatient } from "./addPatient.types"

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not recorded"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "Not recorded"
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatDateTime(value: string | null | undefined): { date: string; time: string } {
  if (!value) return { date: "Not recorded", time: "—" }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return { date: "Not recorded", time: "—" }
  return {
    date: parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: parsed.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  }
}

function calcAge(dateOfBirth: string | null | undefined): number {
  if (!dateOfBirth) return 0
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return 0
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1
  return age
}

function formatGender(gender: string | null | undefined): string {
  if (!gender) return "Not recorded"
  if (gender === "male") return "Male"
  if (gender === "female") return "Female"
  return gender.charAt(0).toUpperCase() + gender.slice(1)
}

function mapRiskLabel(risk: string | null | undefined): string {
  if (risk === "high") return "High Risk"
  if (risk === "moderate") return "Moderate Risk"
  if (risk === "low") return "Low Risk"
  return "Risk not assessed"
}

function mapListRisk(risk: string | null | undefined): "high" | "moderate" | "stable" {
  if (risk === "high") return "high"
  if (risk === "moderate") return "moderate"
  return "stable"
}

export function mapListPatientDisplay(patient: CreatedPatient) {
  return {
    condition: patient.condition?.trim() || patient.chiefComplaint?.trim() || "Not recorded",
    lastVisit: patient.lastVisitDate,
    risk: mapListRisk(patient.riskLevel ?? null),
    status: "in-treatment" as const,
    departmentName: patient.department?.trim() || "Not assigned",
  }
}

export function mapPatientSummary(record: AssistantPatientRecordResponse): AssistantPatientSummary {
  const p = record.patient
  return {
    id: p.id,
    avatarUrl: p.avatarUrl,
    name: p.fullName,
    age: calcAge(p.dateOfBirth),
    gender: formatGender(p.gender),
    mrn: p.id,
    phone: p.phone?.trim() || "Not recorded",
    email: p.email?.trim() || "Not recorded",
    address: p.address?.trim() || "Not recorded",
    maritalStatus: p.maritalStatus
      ? p.maritalStatus.charAt(0).toUpperCase() + p.maritalStatus.slice(1)
      : "Not recorded",
    occupation: p.occupation?.trim() || "Not recorded",
    dateAdded: formatDate(p.patientSince),
    condition: p.condition?.trim() || p.chiefComplaint?.trim() || "Not recorded",
    status: "In treatment",
    riskLevel: mapRiskLabel(p.riskLevel),
    bloodType: p.bloodType ?? "Not recorded",
    lastVisitDate: formatDate(p.lastVisitDate),
    lastVisitType: record.visits[0]?.type?.replace("-", " ") ?? "Not recorded",
    primaryDoctor: record.visits[0]?.doctorName ?? "Not assigned",
    emergencyContact: { name: "Not recorded", relation: "—", phone: "—" },
    insurance: { provider: "Not recorded", policyNumber: "—" },
    height: p.heightCm != null ? `${p.heightCm} cm` : "Not recorded",
    weight: p.weightKg != null ? `${p.weightKg} kg` : "Not recorded",
    bmi: p.bmi != null ? String(p.bmi) : "Not recorded",
    allergies: p.allergies.map((a) => a.allergen).filter(Boolean),
    lifestyle: {
      smoking: {
        status: p.smokingStatus?.replace(/-/g, " ") ?? "Not recorded",
        detail: "Smoking status",
        color: "text-[#6B7870]",
      },
      exercise: {
        status: p.exerciseFrequency?.replace(/-/g, " ") ?? "Not recorded",
        detail: "Physical activity",
        color: "text-[#6B7870]",
      },
      diet: {
        status: p.dietaryHabits?.replace(/-/g, " ") ?? "Not recorded",
        detail: "Diet quality",
        color: "text-[#6B7870]",
      },
      alcohol: {
        status: p.alcoholConsumption ?? "Not recorded",
        detail: "Alcohol",
        color: "text-[#6B7870]",
      },
      sleep: { status: "Not recorded", detail: "Sleep/night", color: "text-[#6B7870]" },
      stress: {
        status: p.stressLevel ?? "Not recorded",
        detail: "Stress level",
        color: "text-[#6B7870]",
      },
    },
    adherence: 0,
    riskScore: p.riskLevel === "high" ? 78 : p.riskLevel === "moderate" ? 55 : 30,
  }
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function mapVitalSummaryCards(
  latest: Record<string, unknown> | null,
): VitalSummaryCard[] {
  if (!latest) {
    return [
      {
        label: "Blood pressure",
        value: "—",
        unit: "mmHg",
        icon: GaugeIcon,
        iconClass: "text-muted-foreground",
        status: "normal",
      },
    ]
  }

  const systolic = num(latest.systolicBp)
  const diastolic = num(latest.diastolicBp)
  const bp =
    systolic != null && diastolic != null ? `${systolic}/${diastolic}` : "—"

  return [
    {
      label: "Blood pressure",
      value: bp,
      unit: "mmHg",
      icon: GaugeIcon,
      iconClass: "text-blue-600",
      status: "normal",
    },
    {
      label: "Heart rate",
      value: num(latest.heartRate)?.toString() ?? "—",
      unit: "bpm",
      icon: HeartPulseIcon,
      iconClass: "text-red-600",
      status: "normal",
    },
    {
      label: "SpO₂",
      value: num(latest.spo2)?.toString() ?? "—",
      unit: "%",
      icon: DropletsIcon,
      iconClass: "text-emerald-600",
      status: "normal",
    },
    {
      label: "Temperature",
      value: num(latest.temperature)?.toString() ?? "—",
      unit: "°F",
      icon: ThermometerIcon,
      iconClass: "text-red-600",
      status: "normal",
    },
    {
      label: "Respiratory rate",
      value: num(latest.respiratoryRate)?.toString() ?? "—",
      unit: "rpm",
      icon: WindIcon,
      iconClass: "text-sky-600",
      status: "normal",
    },
    {
      label: "Weight",
      value: num(latest.weightKg)?.toString() ?? "—",
      unit: "kg",
      icon: ScaleIcon,
      iconClass: "text-orange-600",
      status: "normal",
    },
  ]
}

export function mapVitalsHistory(
  readings: Array<Record<string, unknown>>,
): AssistantVitalsHistoryRow[] {
  return readings.map((row, index) => {
    const takenAt = String(row.createdAt ?? row.takenAt ?? "")
    const { date, time } = formatDateTime(takenAt)
    const systolic = num(row.systolicBp)
    const diastolic = num(row.diastolicBp)
    return {
      id: String(row.id ?? `vital-${index}`),
      date,
      time,
      bp: systolic != null && diastolic != null ? `${systolic}/${diastolic}` : "—",
      hr: num(row.heartRate)?.toString() ?? "—",
      temp: num(row.temperature)?.toString() ?? "—",
      spo2: num(row.spo2)?.toString() ?? "—",
      weight: num(row.weightKg)?.toString() ?? "—",
      glucose: num(row.bloodSugar)?.toString() ?? "—",
      takenBy: String(row.source ?? "Clinic"),
    }
  })
}

export function mapVitalsTrend(
  readings: Array<Record<string, unknown>>,
): AssistantVitalsTrendPoint[] {
  const points = [...readings]
    .reverse()
    .slice(-6)
    .map((row) => {
      const takenAt = String(row.createdAt ?? "")
      const parsed = new Date(takenAt)
      return {
        month: Number.isNaN(parsed.getTime())
          ? "—"
          : parsed.toLocaleDateString("en-US", { month: "short" }),
        systolic: num(row.systolicBp) ?? 0,
        diastolic: num(row.diastolicBp) ?? 0,
      }
    })
  return points.length > 0 ? points : [{ month: "—", systolic: 0, diastolic: 0 }]
}

export function mapAppointments(
  rows: AssistantAppointmentApiRow[],
  patientId: string,
): AssistantAppointmentRow[] {
  return rows
    .filter((row) => row.patientId === patientId)
    .map((row) => {
      const { date, time } = formatDateTime(row.scheduledAt)
      return {
        id: row.id,
        date,
        time,
        doctor: {
          name: row.doctorName,
          department: row.department,
          avatar: "",
        },
        status: row.status,
        type: row.reason?.trim() || row.visitType.replace("-", " "),
        visitMode: row.visitType === "virtual" ? "video" : "in_clinic",
        bookedBy: "Assistant",
      }
    })
}

export function mapVisitHistory(
  visits: AssistantPatientRecordResponse["visits"],
): AssistantVisitHistoryRow[] {
  return visits.map((visit) => ({
    id: visit.id,
    date: formatDate(visit.date),
    timeAgo: "—",
    year: visit.date ? new Date(visit.date).getFullYear().toString() : "—",
    type: visit.type.replace("-", " "),
    doctor: {
      name: visit.doctorName,
      avatar: "",
      department: visit.department,
    },
    summary: visit.chiefComplaint || visit.notes || "No summary recorded",
    tags: [],
    status: visit.status === "completed" ? "Completed" : visit.status,
  }))
}

export function mapLabResults(
  labResults: Array<Record<string, unknown>>,
): AssistantLabReportRow[] {
  const grouped = new Map<string, AssistantLabReportRow>()

  for (const row of labResults) {
    const resultAt = String(row.resultAt ?? row.createdAt ?? "")
    const dayKey = resultAt.slice(0, 10) || "unknown"
    const testName = String(row.testName ?? "Lab test")
    const groupKey = `${dayKey}-${testName}`

    const existing = grouped.get(groupKey)
    const test = {
      name: testName,
      value: String(row.value ?? "—"),
      unit: String(row.unit ?? ""),
      range: String(row.referenceRange ?? "—"),
      status: String(row.status ?? "normal"),
    }

    if (existing) {
      existing.tests.push(test)
      continue
    }

    grouped.set(groupKey, {
      id: String(row.id ?? groupKey),
      date: formatDate(resultAt),
      title: testName,
      category: "Biochemistry",
      doctor: {
        name: "Not recorded",
        avatar: "",
        department: "Laboratory",
      },
      tests: [test],
    })
  }

  return [...grouped.values()]
}

export function mapPrescriptions(
  medications: Array<Record<string, unknown>>,
): AssistantPrescriptionRow[] {
  const grouped = new Map<string, AssistantPrescriptionRow>()

  for (const med of medications) {
    const createdAt = String(med.createdAt ?? med.startDate ?? "")
    const dayKey = createdAt.slice(0, 10) || "unknown"
    const groupKey = dayKey

    const medRow: AssistantPrescriptionMedRow = {
      name: String(med.name ?? "Medication"),
      dosage: String(med.dose ?? "—"),
      frequency: String(med.frequency ?? "—"),
      duration: med.durationDays ? `${med.durationDays} days` : "Ongoing",
      quantity: "—",
      instructions: String(med.instructions ?? "—"),
    }

    const existing = grouped.get(groupKey)
    if (existing) {
      existing.medications.push(medRow)
      continue
    }

    grouped.set(groupKey, {
      id: String(med.id ?? groupKey),
      date: formatDate(createdAt),
      status: String(med.status ?? "active"),
      doctor: {
        name: "Prescribing physician",
        department: "Cardiology",
        avatar: "",
      },
      medications: [medRow],
    })
  }

  return [...grouped.values()]
}

export function mapMedicalHistoryProps(record: AssistantPatientRecordResponse) {
  return {
    conditions: record.diagnoses.map((d, index) => ({
      id: String(d.id ?? `dx-${index}`),
      name: String(d.description ?? "Condition"),
      status: (String(d.status ?? "active") === "resolved" ? "resolved" : "chronic") as
        | "active"
        | "resolved"
        | "chronic",
      diagnosedDate: formatDate(String(d.diagnosedAt ?? "")),
      notes: String(d.clinicalNotes ?? "No notes recorded"),
      severity: (String(d.severity ?? "moderate") as "low" | "moderate" | "high") || "moderate",
    })),
    surgeries: [] as Array<{
      id: string
      procedure: string
      date: string
      hospital: string
      surgeon: string
      outcome: string
    }>,
    allergies: record.patient.allergies.map((a) => ({
      id: a.id,
      allergen: a.allergen,
      reaction: a.reaction?.trim() || "Not specified",
      severity: "moderate" as const,
    })),
    familyHistory: record.patient.familyHistory.map((f) => ({
      relation: f.relationship,
      condition: f.condition,
      ageOfOnset: f.details?.trim() || undefined,
    })),
  }
}

export function mapDocumentsProps(record: AssistantPatientRecordResponse) {
  return record.documents.map((doc) => {
    const category =
      doc.category === "lab_report"
        ? "lab"
        : doc.category === "imaging" || doc.category === "ecg"
          ? "imaging"
          : "clinical"

    return {
      id: doc.id,
      name: doc.title?.trim() || doc.fileName,
      category: category as "lab" | "imaging" | "clinical" | "insurance",
      type: "pdf" as const,
      size: doc.fileSize ?? "—",
      uploadedAt: formatDate(doc.uploadedAt),
      uploadedBy: "Clinic staff",
    }
  })
}

export function emptyHubMessage(section: string) {
  return `No ${section} recorded for this patient yet.`
}
