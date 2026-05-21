import type { QueuePatient, QueueStatus } from "../assistantQueue.types"
import { formatVisitDate } from "../assistantQueue.liveBoard"

export type PastVisitsTimeFilter = "today" | "yesterday" | "week" | "month" | "all"
export type PastVisitsStatusFilter = "all" | QueueStatus

const TERMINAL_STATUSES: QueueStatus[] = ["completed", "no-show", "cancelled"]

export function isPastVisit(p: QueuePatient): boolean {
  return TERMINAL_STATUSES.includes(p.status)
}

export function filterHistoryPatients(patients: QueuePatient[]): QueuePatient[] {
  return patients.filter(isPastVisit)
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function matchesTimeFilter(scheduledTime: string, timeFilter: PastVisitsTimeFilter): boolean {
  const visitDate = new Date(scheduledTime)
  const now = new Date()
  const today = startOfDay(now)

  if (timeFilter === "all") return true
  if (timeFilter === "today") return visitDate >= today
  if (timeFilter === "yesterday") {
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    return visitDate >= yesterday && visitDate < today
  }
  if (timeFilter === "week") {
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    return visitDate >= weekAgo
  }
  const monthAgo = new Date(today)
  monthAgo.setDate(monthAgo.getDate() - 30)
  return visitDate >= monthAgo
}

export function filterPastVisits(
  patients: QueuePatient[],
  opts: {
    search: string
    statusFilter: PastVisitsStatusFilter
    timeFilter: PastVisitsTimeFilter
    doctorFilter: string
  },
): QueuePatient[] {
  const q = opts.search.trim().toLowerCase()
  return patients
    .filter(isPastVisit)
    .filter((p) => {
      const matchesSearch =
        !q ||
        p.fullName.toLowerCase().includes(q) ||
        p.assignedDoctor.toLowerCase().includes(q) ||
        p.condition.toLowerCase().includes(q) ||
        p.phoneNumber.includes(q)
      const matchesStatus = opts.statusFilter === "all" || p.status === opts.statusFilter
      const matchesDoctor = opts.doctorFilter === "all" || p.assignedDoctor === opts.doctorFilter
      const matchesTime = matchesTimeFilter(p.scheduledTime, opts.timeFilter)
      return matchesSearch && matchesStatus && matchesDoctor && matchesTime
    })
    .sort((a, b) => Date.parse(b.scheduledTime) - Date.parse(a.scheduledTime))
}

export function computePastVisitStats(patients: QueuePatient[]) {
  const past = filterHistoryPatients(patients)
  return {
    total: past.length,
    completed: past.filter((p) => p.status === "completed").length,
    noShow: past.filter((p) => p.status === "no-show").length,
    cancelled: past.filter((p) => p.status === "cancelled").length,
  }
}

export function dateGroupKey(iso: string): string {
  const d = startOfDay(new Date(iso))
  return d.toISOString().slice(0, 10)
}

export function dateGroupLabel(iso: string): string {
  const visit = startOfDay(new Date(iso))
  const today = startOfDay(new Date())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (visit.getTime() === today.getTime()) return "Today"
  if (visit.getTime() === yesterday.getTime()) return "Yesterday"
  return formatVisitDate(iso)
}

export type PastVisitDateGroup = {
  key: string
  label: string
  patients: QueuePatient[]
}

export function groupPastVisitsByDate(patients: QueuePatient[]): PastVisitDateGroup[] {
  const map = new Map<string, PastVisitDateGroup>()
  for (const p of patients) {
    const key = dateGroupKey(p.scheduledTime)
    const existing = map.get(key)
    if (existing) {
      existing.patients.push(p)
    } else {
      map.set(key, {
        key,
        label: dateGroupLabel(p.scheduledTime),
        patients: [p],
      })
    }
  }
  return [...map.values()].sort((a, b) => b.key.localeCompare(a.key))
}

export function shouldGroupByDate(timeFilter: PastVisitsTimeFilter): boolean {
  return timeFilter === "week" || timeFilter === "month" || timeFilter === "all"
}

export const STATUS_SECTION_META: Record<
  Exclude<QueueStatus, "scheduled" | "arrived" | "waiting" | "in-consultation">,
  { title: string; className: string }
> = {
  completed: { title: "Completed", className: "text-[#1A5345]" },
  "no-show": { title: "No show", className: "text-red-600" },
  cancelled: { title: "Cancelled", className: "text-[#6B7870]" },
}
