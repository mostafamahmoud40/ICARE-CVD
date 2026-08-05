export function formatProfileDate(iso: string | null | undefined) {
  if (!iso) return null
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(iso),
  )
}

export function calcProfileAge(dob: string) {
  const today = new Date()
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function patientRiskBadgeClassName(riskLabel: string): string {
  const lower = riskLabel.toLowerCase()
  if (lower.includes("high")) {
    return "rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm border-0"
  }
  if (lower.includes("moderate")) {
    return "rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm border-0"
  }
  if (lower.includes("low")) {
    return "rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm border-0"
  }
  return "rounded-lg bg-[#6B7870] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm border-0"
}

export function patientRiskAccentClassName(riskLabel: string): string {
  const lower = riskLabel.toLowerCase()
  if (lower.includes("high")) return "text-rose-600"
  if (lower.includes("moderate")) return "text-amber-600"
  if (lower.includes("low")) return "text-emerald-600"
  return "text-muted-foreground"
}
