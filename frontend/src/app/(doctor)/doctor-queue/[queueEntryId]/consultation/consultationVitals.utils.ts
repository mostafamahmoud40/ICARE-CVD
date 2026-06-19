import type { ConsultationVitalReading, VitalSigns } from "./consultation.types"

export type ApiVitalRow = {
  id: string
  date: string | Date
  time?: string | null
  source?: "home" | "clinic" | "hospital" | null
  systolicBp?: number | null
  diastolicBp?: number | null
  heartRate?: number | null
  oxygenSaturation?: number | null
  temperature?: string | number | null
  weight?: string | number | null
  bloodSugar?: number | null
  notes?: string | null
  createdAt?: string | Date
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function toIsoDate(value: string | Date): string {
  if (typeof value === "string") return value.slice(0, 10)
  return value.toISOString().slice(0, 10)
}

function parseVitalNotes(notes: string | null | undefined): {
  respiratoryRate: string
  heightCm: string
} {
  if (!notes) return { respiratoryRate: "", heightCm: "" }
  try {
    const parsed = JSON.parse(notes) as {
      respiratoryRate?: number | string
      heightCm?: number | string
    }
    if (parsed && typeof parsed === "object") {
      return {
        respiratoryRate:
          parsed.respiratoryRate != null ? String(parsed.respiratoryRate) : "",
        heightCm: parsed.heightCm != null ? String(parsed.heightCm) : "",
      }
    }
  } catch {
    /* plain clinical notes */
  }
  return { respiratoryRate: "", heightCm: "" }
}

function encodeVitalNotes(vitals: VitalSigns): string | undefined {
  const respiratoryRate = vitals.respiratoryRate.trim()
  const heightCm = vitals.heightCm.trim()
  if (!respiratoryRate && !heightCm) return undefined
  return JSON.stringify({
    respiratoryRate: respiratoryRate ? Number(respiratoryRate) : undefined,
    heightCm: heightCm ? Number(heightCm) : undefined,
  })
}

export function emptyVitalSigns(): VitalSigns {
  return {
    systolicBP: "",
    diastolicBP: "",
    heartRate: "",
    temperature: "",
    respiratoryRate: "",
    oxygenSaturation: "",
    heightCm: "",
    weightKg: "",
  }
}

export function mapApiRowToConsultationReading(row: ApiVitalRow): ConsultationVitalReading {
  const extras = parseVitalNotes(row.notes ?? null)
  return {
    id: row.id,
    date: toIsoDate(row.date),
    time: row.time ?? "",
    source: row.source ?? "clinic",
    systolicBP: row.systolicBp ?? null,
    diastolicBP: row.diastolicBp ?? null,
    heartRate: row.heartRate ?? null,
    oxygenSaturation: row.oxygenSaturation ?? null,
    temperature: row.temperature != null ? Number(row.temperature) : null,
    respiratoryRate: extras.respiratoryRate ? Number(extras.respiratoryRate) : null,
    weight: row.weight != null ? Number(row.weight) : null,
    heightCm: extras.heightCm ? Number(extras.heightCm) : null,
    bloodSugar: row.bloodSugar ?? null,
    notes: row.notes ?? "",
  }
}

export function mapApiRowToVitalSigns(row: ApiVitalRow): VitalSigns {
  const extras = parseVitalNotes(row.notes ?? null)
  return {
    systolicBP: row.systolicBp != null ? String(row.systolicBp) : "",
    diastolicBP: row.diastolicBp != null ? String(row.diastolicBp) : "",
    heartRate: row.heartRate != null ? String(row.heartRate) : "",
    temperature: row.temperature != null ? String(row.temperature) : "",
    respiratoryRate: extras.respiratoryRate,
    oxygenSaturation: row.oxygenSaturation != null ? String(row.oxygenSaturation) : "",
    heightCm: extras.heightCm,
    weightKg: row.weight != null ? String(row.weight) : "",
  }
}

export function mapConsultationReadingToVitalSigns(reading: ConsultationVitalReading): VitalSigns {
  return {
    systolicBP: reading.systolicBP != null ? String(reading.systolicBP) : "",
    diastolicBP: reading.diastolicBP != null ? String(reading.diastolicBP) : "",
    heartRate: reading.heartRate != null ? String(reading.heartRate) : "",
    temperature: reading.temperature != null ? String(reading.temperature) : "",
    respiratoryRate: reading.respiratoryRate != null ? String(reading.respiratoryRate) : "",
    oxygenSaturation: reading.oxygenSaturation != null ? String(reading.oxygenSaturation) : "",
    heightCm: reading.heightCm != null ? String(reading.heightCm) : "",
    weightKg: reading.weight != null ? String(reading.weight) : "",
  }
}

export function findTodayClinicReading(readings: ApiVitalRow[]): ApiVitalRow | null {
  const today = todayIso()
  return (
    readings.find((row) => toIsoDate(row.date) === today && row.source === "clinic") ?? null
  )
}

export function pickLastVitalReading(
  readings: ApiVitalRow[],
  currentSessionId: string | null,
): ConsultationVitalReading | null {
  const reference =
    readings.find((row) => row.id !== currentSessionId) ??
    (currentSessionId ? null : readings[0])
  return reference ? mapApiRowToConsultationReading(reference) : null
}

function parseOptionalInt(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number.parseInt(trimmed, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseOptionalFloat(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number.parseFloat(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function vitalSignsToApiPayload(vitals: VitalSigns) {
  return {
    source: "clinic" as const,
    systolicBp: parseOptionalInt(vitals.systolicBP),
    diastolicBp: parseOptionalInt(vitals.diastolicBP),
    heartRate: parseOptionalInt(vitals.heartRate),
    oxygenSaturation: parseOptionalInt(vitals.oxygenSaturation),
    temperature: parseOptionalFloat(vitals.temperature),
    weight: parseOptionalFloat(vitals.weightKg),
    notes: encodeVitalNotes(vitals),
  }
}

export function hasPersistableVitalValue(vitals: VitalSigns): boolean {
  const payload = vitalSignsToApiPayload(vitals)
  return (
    payload.systolicBp != null ||
    payload.diastolicBp != null ||
    payload.heartRate != null ||
    payload.oxygenSaturation != null ||
    payload.temperature != null ||
    payload.weight != null ||
    payload.notes != null
  )
}

export function hasBpPairMismatch(vitals: VitalSigns): boolean {
  const hasSystolic = vitals.systolicBP.trim() !== ""
  const hasDiastolic = vitals.diastolicBP.trim() !== ""
  return hasSystolic !== hasDiastolic
}
