export function formatShortTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function patientInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}
