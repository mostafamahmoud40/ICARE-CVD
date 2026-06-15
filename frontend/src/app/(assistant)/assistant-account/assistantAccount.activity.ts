import type { ActivityEntry } from "./assistantAccount.types"

export type ActivityPeriodFilter = "week" | "month" | "year" | "all"
export type ActivityTypeFilter = "all" | ActivityEntry["type"]

export const ACTIVITY_PERIOD_OPTIONS = [
  { key: "week" as const, label: "This week", shortLabel: "7 days" },
  { key: "month" as const, label: "This month", shortLabel: "30 days" },
  { key: "year" as const, label: "This year", shortLabel: "12 months" },
  { key: "all" as const, label: "All time", shortLabel: "Full history" },
]

export const ACTIVITY_TYPE_OPTIONS = [
  { key: "all" as const, label: "All types" },
  { key: "patient" as const, label: "Patients" },
  { key: "appointment" as const, label: "Appointments" },
  { key: "queue" as const, label: "Queue" },
  { key: "document" as const, label: "Documents" },
]

const PERIOD_MS: Record<Exclude<ActivityPeriodFilter, "all">, number> = {
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000,
}

function matchesSearch(entry: ActivityEntry, search: string) {
  const q = search.trim().toLowerCase()
  if (!q) return true
  return (
    entry.action.toLowerCase().includes(q) ||
    entry.description.toLowerCase().includes(q) ||
    entry.type.toLowerCase().includes(q)
  )
}

export function filterActivities(
  activities: ActivityEntry[],
  period: ActivityPeriodFilter,
  typeFilter: ActivityTypeFilter,
  search = "",
  now = Date.now(),
): ActivityEntry[] {
  const cutoff = period === "all" ? null : now - PERIOD_MS[period]

  return [...activities]
    .filter((entry) => {
      if (cutoff !== null && new Date(entry.timestamp).getTime() < cutoff) return false
      if (typeFilter !== "all" && entry.type !== typeFilter) return false
      return matchesSearch(entry, search)
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function countActivitiesByType(activities: ActivityEntry[]) {
  return activities.reduce(
    (acc, entry) => {
      acc[entry.type] += 1
      acc.total += 1
      return acc
    },
    { total: 0, patient: 0, appointment: 0, queue: 0, document: 0 },
  )
}

function startOfLocalDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function formatActivityGroupLabel(iso: string, now = new Date()) {
  const date = new Date(iso)
  const today = startOfLocalDay(now)
  const target = startOfLocalDay(date)
  const diffDays = Math.round((today.getTime() - target.getTime()) / (24 * 60 * 60 * 1000))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  }).format(date)
}

export function groupActivitiesByDate(activities: ActivityEntry[], now = new Date()) {
  const groups = new Map<string, ActivityEntry[]>()

  for (const entry of activities) {
    const label = formatActivityGroupLabel(entry.timestamp, now)
    const bucket = groups.get(label)
    if (bucket) bucket.push(entry)
    else groups.set(label, [entry])
  }

  return Array.from(groups.entries()).map(([label, entries]) => ({ label, entries }))
}
