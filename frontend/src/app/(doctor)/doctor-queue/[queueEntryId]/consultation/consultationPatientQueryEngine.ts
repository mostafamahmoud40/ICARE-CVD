import type { ConsultationData } from "./consultation.types"

function calculateBMI(heightCm: string, weightKg: string): number | null {
  const height = parseFloat(heightCm)
  const weight = parseFloat(weightKg)
  if (Number.isNaN(height) || Number.isNaN(weight) || height <= 0 || weight <= 0) return null
  const hM = height / 100
  return Number((weight / (hM * hM)).toFixed(1))
}

function hasAnyVital(v: ConsultationData["vitals"]): boolean {
  return Object.values(v).some((x) => String(x).trim() !== "")
}

function formatVitals(data: ConsultationData): string {
  const v = data.vitals
  const bmi = calculateBMI(v.heightCm, v.weightKg)
  const lines = [
    "Current vitals in this consultation:",
    `• Systolic / Diastolic BP: ${v.systolicBP || "—"} / ${v.diastolicBP || "—"} mmHg`,
    `• Heart rate: ${v.heartRate || "—"} bpm`,
    `• Temperature: ${v.temperature || "—"} °C`,
    `• Respiratory rate: ${v.respiratoryRate || "—"} /min`,
    `• SpO₂: ${v.oxygenSaturation || "—"} %`,
    `• Height / Weight: ${v.heightCm || "—"} cm / ${v.weightKg || "—"} kg`,
    bmi != null ? `• BMI (from height/weight): ${bmi}` : "• BMI: enter height and weight to compute.",
  ]
  const sys = parseFloat(v.systolicBP)
  const dia = parseFloat(v.diastolicBP)
  if (!Number.isNaN(sys) && !Number.isNaN(dia)) {
    if (sys >= 130 || dia >= 80) lines.push("Note: BP meets or exceeds common adult hypertension thresholds (≥130/80).")
    else if (sys >= 120 || dia >= 80) lines.push("Note: BP is in the elevated range for many guidelines (120–129/<80 or higher).")
  }
  return lines.join("\n")
}

function formatAllergies(data: ConsultationData): string {
  const a = data.patientSummary.allergies
  if (a.length === 0) return "No allergies recorded in the patient summary."
  return (
    "Allergies:\n" +
    a.map((x) => `• ${x.allergen} (${x.category}) — ${x.reaction}`).join("\n")
  )
}

function formatMedications(data: ConsultationData): string {
  const m = data.patientSummary.activeMedications
  if (m.length === 0) return "No active medications in the patient summary."
  return (
    "Active medications:\n" +
    m.map((x) => `• ${x.name} — ${x.dose}, ${x.frequency}`).join("\n")
  )
}

function formatConditions(data: ConsultationData): string {
  const c = data.patientSummary.existingConditions
  if (c.length === 0) return "No existing conditions listed in the patient summary."
  return (
    "Existing conditions:\n" +
    c.map((x) => `• ${x.name} (${x.diagnosedAt}) — ${x.details}`).join("\n")
  )
}

function formatDiagnosesThisVisit(data: ConsultationData): string {
  const d = data.diagnoses
  if (d.length === 0) return "No diagnoses added for this visit yet."
  return (
    "Diagnoses on this encounter:\n" +
    d.map((x) => `• ${x.description} (${x.icdCode}) — ${x.type}, ${x.severity}`).join("\n")
  )
}

function formatComplaint(data: ConsultationData): string {
  const parts = [
    `Structured complaint code: ${data.structuredComplaint || "—"}`,
    `Chief complaint (free text): ${data.chiefComplaint || "—"}`,
  ]
  return parts.join("\n")
}

function formatPhysicalExam(data: ConsultationData): string {
  const p = data.physicalExam
  return [
    "Physical exam (this visit):",
    `• Heart sounds: ${p.heartSounds || "—"}`,
    `• Murmurs: ${p.murmurs || "—"}`,
    `• JVP: ${p.jvp || "—"}`,
    `• Peripheral edema: ${p.peripheralEdema || "—"}`,
    `• Lungs: ${p.lungAuscultation || "—"}`,
    `• Other: ${p.additionalFindings || "—"}`,
  ].join("\n")
}

function formatTests(data: ConsultationData): string {
  const t = data.testOrders
  if (t.length === 0) return "No test orders entered for this visit."
  return (
    "Test orders:\n" +
    t.map((x) => `• ${x.testName} (${x.testType}) — ${x.urgency}`).join("\n")
  )
}

function formatHomeMeasurements(data: ConsultationData): string {
  const h = data.homeMeasurements
  if (h.length === 0) return "No home measurement plans added."
  return (
    "Home measurements:\n" +
    h.map((x) => `• ${x.metricLabel}: ${x.frequency} — target ${x.targetRange}`).join("\n")
  )
}

function formatNotes(data: ConsultationData): string {
  return [
    `Clinical notes: ${data.clinicalNotes || "—"}`,
    `Assessment & plan: ${data.assessmentAndPlan || "—"}`,
    `Follow-up: ${data.followUpDate || "—"} — ${data.followUpNotes || "—"}`,
  ].join("\n")
}

function formatDemographics(data: ConsultationData): string {
  const d = data.patientSummary.demographics
  return [
    `${d.fullName}, ${d.age} yrs, ${d.gender}, blood type ${d.bloodType}`,
    `DOB: ${d.dateOfBirth} · Phone: ${d.phone}`,
    `Occupation: ${d.occupation} · ${d.maritalStatus}`,
  ].join("\n")
}

function formatLifestyle(data: ConsultationData): string {
  const f = data.patientSummary.lifestyleFlags
  if (f.length === 0) return "No lifestyle flags recorded."
  return f.map((x) => `• ${x.label} (${x.riskLevel}): ${x.value}`).join("\n")
}

function formatFamilyHistory(data: ConsultationData): string {
  const fh = data.patientSummary.familyHistory
  if (fh.length === 0) return "No family history recorded."
  return fh.map((x) => `• ${x.relationship}: ${x.condition} — ${x.details}`).join("\n")
}

function formatHelp(): string {
  return [
    "Try asking about this patient, for example:",
    "• vitals, BP, heart rate, BMI",
    "• allergies, medications, conditions",
    "• chief complaint, physical exam, tests",
    "• demographics, family history, lifestyle",
    "• notes, diagnoses (this visit), home measurements",
    "• summary — short overview",
  ].join("\n")
}

function formatSummary(data: ConsultationData): string {
  const d = data.patientSummary.demographics
  const vitalsEntered = hasAnyVital(data.vitals)
  return [
    `Patient: ${d.fullName} (${d.age} yrs, ${d.gender})`,
    vitalsEntered ? "Vitals: partially or fully entered in this visit." : "Vitals: not yet entered in this visit.",
    `${data.patientSummary.allergies.length} allergies, ${data.patientSummary.activeMedications.length} active meds, ${data.patientSummary.existingConditions.length} conditions in chart summary.`,
    `${data.diagnoses.length} diagnosis(es) on this encounter so far.`,
  ].join("\n")
}

/** Lightweight lookup from the live consultation record (mock-friendly, no network). */
export function answerPatientConsultationQuery(query: string, data: ConsultationData): string {
  const q = query.trim().toLowerCase()
  if (!q) return "Type a question, then press Enter or Send."

  if (/\b(help|what can|how do)\b/.test(q)) return formatHelp()

  if (/\b(summary|overview|snapshot)\b/.test(q)) return formatSummary(data)

  if (/\b(demographic|patient info|who is|profile)\b/.test(q)) return formatDemographics(data)

  if (/\b(vital|bp|blood pressure|heart rate|pulse|temp|spo2|oxygen|respiratory|height|weight|bmi)\b/.test(q)) {
    return formatVitals(data)
  }

  if (/\ballerg/.test(q)) return formatAllergies(data)

  if (/\b(med|drug|pill|prescription)\b/.test(q)) return formatMedications(data)

  if (/\b(condition|problem|history chart|past medical)\b/.test(q)) return formatConditions(data)

  if (/\b(diagnos|icd|dx\b)/.test(q)) return formatDiagnosesThisVisit(data)

  if (/\b(complaint|presenting|symptom)\b/.test(q)) return formatComplaint(data)

  if (/\b(physical|exam|auscultation|murmur|jvp|edema)\b/.test(q)) return formatPhysicalExam(data)

  if (/\b(test|lab|order|imaging|ecg)\b/.test(q)) return formatTests(data)

  if (/\b(home|measurement plan|self monitor)\b/.test(q)) return formatHomeMeasurements(data)

  if (/\b(note|plan|assessment|follow)\b/.test(q)) return formatNotes(data)

  if (/\b(family|relative)\b/.test(q)) return formatFamilyHistory(data)

  if (/\b(lifestyle|smok|alcohol|exercise|diet|stress|bmi flag)\b/.test(q)) return formatLifestyle(data)

  if (/\b(compare|versus|vs\.|trend)\b/.test(q)) {
    if (!hasAnyVital(data.vitals)) {
      return "Enter vitals in the form above first, then ask again to compare against common adult screening thresholds (this is a quick local summary, not a full decision tool)."
    }
    return `${formatVitals(data)}\n\nComparison: values above are shown alongside generic notes where BP numbers are present. For formal interpretation use your clinical judgment and local protocols.`
  }

  // Free-text search across major string fields
  const haystack: string[] = []
  const push = (label: string, s: string) => {
    if (s.trim()) haystack.push(`${label}: ${s}`)
  }
  push("Chief complaint", data.chiefComplaint)
  push("Clinical notes", data.clinicalNotes)
  push("Assessment", data.assessmentAndPlan)
  data.diagnoses.forEach((d) => push("Diagnosis", `${d.description} ${d.notes ?? ""}`))
  data.patientSummary.existingConditions.forEach((c) => push("Condition", `${c.name} ${c.details}`))

  const matches = haystack.filter((line) => line.toLowerCase().includes(q))
  if (matches.length > 0) {
    return `Matches for “${query.trim()}”:\n\n${matches.slice(0, 8).join("\n")}`
  }

  return `No built-in topic matched “${query.trim()}”. ${formatHelp()}`
}
