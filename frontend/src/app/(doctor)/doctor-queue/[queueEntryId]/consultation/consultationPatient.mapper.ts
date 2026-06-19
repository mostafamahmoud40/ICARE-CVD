import type { PatientFullRecord } from "@/app/(doctor)/doctor-patients/doctorPatients.types"
import { calcPatientAge } from "@/app/(doctor)/doctor-patients/doctorPatients.utils"
import type { LifestyleFlag, PatientSummary } from "./consultation.types"

function buildLifestyleFlags(
  smokingStatus: string,
  bmi: number | null,
): LifestyleFlag[] {
  const flags: LifestyleFlag[] = []

  const smoking = smokingStatus.trim()
  if (smoking) {
    const lower = smoking.toLowerCase()
    flags.push({
      label: "Smoking",
      value: smoking,
      riskLevel: lower.includes("current")
        ? "high"
        : lower.includes("former")
          ? "moderate"
          : "low",
    })
  }

  if (bmi != null) {
    flags.push({
      label: "BMI",
      value: `${bmi}${bmi >= 30 ? " (Obese)" : bmi >= 25 ? " (Overweight)" : ""}`,
      riskLevel: bmi >= 30 ? "high" : bmi >= 25 ? "moderate" : "low",
    })
  }

  return flags
}

export function mapPatientFullRecordToSummary(record: PatientFullRecord): PatientSummary {
  const p = record.patient

  return {
    demographics: {
      fullName: p.fullName,
      age: calcPatientAge(p.dateOfBirth),
      gender: p.gender,
      bloodType: p.bloodType?.trim() ? p.bloodType : "—",
      dateOfBirth: p.dateOfBirth,
      nationalId: p.nationalId ?? "",
      phone: p.phone ?? "",
      email: p.email ?? "",
      address: p.address ?? "",
      occupation: p.occupation ?? "",
      maritalStatus: p.maritalStatus ?? "",
    },
    allergies: p.allergies.map((entry) => ({
      id: entry.id,
      category: entry.category,
      allergen: entry.allergen,
      reaction: entry.reaction,
    })),
    activeMedications: record.medications
      .filter((medication) => medication.status === "active")
      .map((medication) => ({
        id: medication.id,
        name: medication.name,
        dose: medication.dose,
        frequency: medication.frequency,
        status: "active" as const,
      })),
    familyHistory: p.familyHistory.map((entry) => ({
      id: entry.id,
      relationship: entry.relationship,
      condition: entry.condition,
      details: entry.details,
    })),
    lifestyleFlags: buildLifestyleFlags(p.smokingStatus ?? "", p.bmi),
    existingConditions: record.diagnoses
      .filter((diagnosis) => diagnosis.status === "active" || diagnosis.status === "chronic")
      .map((diagnosis) => ({
        id: diagnosis.id,
        name: diagnosis.description,
        details: [diagnosis.icdCode, diagnosis.severity].filter(Boolean).join(" · "),
        diagnosedAt: diagnosis.diagnosedAt,
      })),
  }
}
