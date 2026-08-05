import type {
  ActiveMedicationAssistant,
  PastMedicationRow,
} from "../assistant-patients/[patientId]/assistantPatientProfile.types"
import type { MedicationLine, MedicationType } from "./assistantMedications.types"
import type { PastMedicationTableRow } from "./PatientMedicationsTableSection"

function inferMedicationType(strength: string): MedicationType {
  const lower = strength.toLowerCase()
  if (lower.includes("injection") || lower.includes("subcutaneous")) return "injection"
  if (lower.includes("solution") || lower.includes("syrup")) return "solution"
  return "pill"
}

function buildAdherenceHistory(pct: number): boolean[] {
  const takenDays = Math.round((Math.min(100, Math.max(0, pct)) / 100) * 7)
  return Array.from({ length: 7 }, (_, index) => index < takenDays)
}

export function mapActiveMedicationToLine(med: ActiveMedicationAssistant): MedicationLine {
  const timesLabel =
    med.timesOfDay.length > 0 ? `Times: ${med.timesOfDay.join(", ")}.` : ""

  return {
    id: med.id,
    name: med.name,
    strength: med.strength,
    type: inferMedicationType(med.strength),
    dosageInstructions: [med.instructionPatient, med.frequencyLabel, med.withFood, timesLabel]
      .filter(Boolean)
      .join(" "),
    frequencyLabel: med.frequencyLabel,
    adherencePct7d: med.adherencePct,
    missedLast7d: 7 - buildAdherenceHistory(med.adherencePct).filter(Boolean).length,
    nextRefillDue: null,
    adherenceHistory7d: buildAdherenceHistory(med.adherencePct),
  }
}

export function mapPastMedicationToRow(med: PastMedicationRow): PastMedicationTableRow {
  return {
    id: med.id,
    name: med.name,
    strength: med.strength,
    dosageInstructions: `${med.note} Ended ${med.endedOn}.`,
    statusLabel: med.kind === "discontinued" ? "Discontinued" : "Course completed",
  }
}
