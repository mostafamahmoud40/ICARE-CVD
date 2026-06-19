import type { Vital } from "./dashboard.types"

export type VitalRangeStatus = "normal" | "warning" | "critical"

function parseNumber(value: string): number | null {
  const parsed = Number.parseFloat(value.replace(/[^\d.]/g, ""))
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeReference(reference: string) {
  return reference.replace(/[–—]/g, "-").trim()
}

function deviationSeverity(ratio: number): VitalRangeStatus {
  if (ratio >= 0.15) return "critical"
  if (ratio > 0) return "warning"
  return "normal"
}

function evaluateBloodPressure(value: string, reference: string): VitalRangeStatus {
  const [sysRaw, diaRaw] = value.split("/")
  const systolic = parseNumber(sysRaw ?? "")
  const diastolic = parseNumber(diaRaw ?? "")
  if (systolic == null || diastolic == null) return "normal"

  const ref = normalizeReference(reference)

  if (systolic >= 140 || diastolic >= 90) return "critical"
  if (systolic >= 130 || diastolic >= 85) return "warning"

  const upperBound = ref.match(/<\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/)
  if (upperBound) {
    const maxSys = Number(upperBound[1])
    const maxDia = Number(upperBound[2])
    if (systolic >= maxSys || diastolic >= maxDia) return "warning"
    return "normal"
  }

  const range = ref.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/)
  if (range) {
    const minSys = Number(range[1])
    const maxSys = Number(range[2])
    const minDia = Number(range[3])
    const maxDia = Number(range[4])

    if (systolic < minSys) return deviationSeverity((minSys - systolic) / minSys)
    if (systolic > maxSys) return deviationSeverity((systolic - maxSys) / maxSys)
    if (diastolic < minDia) return deviationSeverity((minDia - diastolic) / minDia)
    if (diastolic > maxDia) return deviationSeverity((diastolic - maxDia) / maxDia)
    return "normal"
  }

  return "normal"
}

function evaluateNumericValue(value: number, reference: string): VitalRangeStatus {
  const ref = normalizeReference(reference)

  const range = ref.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/)
  if (range) {
    const min = Number(range[1])
    const max = Number(range[2])
    if (value < min) return deviationSeverity((min - value) / min)
    if (value > max) return deviationSeverity((value - max) / max)
    return "normal"
  }

  if (ref.startsWith("<")) {
    const max = parseNumber(ref.slice(1))
    if (max != null && value >= max) return deviationSeverity((value - max) / max)
    return "normal"
  }

  if (ref.startsWith(">")) {
    const min = parseNumber(ref.slice(1))
    if (min != null && value <= min) return deviationSeverity((min - value) / min)
    return "normal"
  }

  return "normal"
}

export function getVitalRangeStatus(vital: Vital): VitalRangeStatus {
  if (vital.status) return vital.status
  if (!vital.reference) return "normal"

  if (vital.value.includes("/")) {
    return evaluateBloodPressure(vital.value, vital.reference)
  }

  const numericValue = parseNumber(vital.value)
  if (numericValue == null) return "normal"

  return evaluateNumericValue(numericValue, vital.reference)
}

export const VITAL_STATUS_LABELS: Record<VitalRangeStatus, string> = {
  normal: "Normal",
  warning: "Elevated",
  critical: "Out of range",
}

export const VITAL_STATUS_STYLES: Record<
  VitalRangeStatus,
  {
    value: string
    icon: string
    badge: string
  }
> = {
  normal: {
    value: "text-emerald-700",
    icon: "text-emerald-600",
    badge: "bg-emerald-600 text-white",
  },
  warning: {
    value: "text-amber-700",
    icon: "text-amber-600",
    badge: "bg-amber-500 text-white",
  },
  critical: {
    value: "text-rose-700",
    icon: "text-rose-600",
    badge: "bg-rose-600 text-white",
  },
}
