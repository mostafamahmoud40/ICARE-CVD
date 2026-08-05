import type { ConsultationStats, VisitSummary } from "./consultations.types"

export function formatConsultationTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(iso))
}

export function formatConsultationDateLong(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(iso))
}

export function formatConsultationDateMedium(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(iso))
}

export function formatConsultationDateShort(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function formatConsultationTimeAgo(iso: string, now = new Date()): string {
  const then = new Date(iso)
  const diffMs = now.getTime() - then.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days < 1) return "Today"
  if (days === 1) return "1 day ago"
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months === 1) return "1 month ago"
  if (months < 12) return `${months} months ago`
  const years = Math.floor(months / 12)
  return years === 1 ? "1 year ago" : `${years} years ago`
}

export function hasPendingOrders(visit: VisitSummary): boolean {
  return visit.orders.some((order) => order.status === "pending")
}

export function computeConsultationStats(visits: VisitSummary[]): ConsultationStats {
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()

  return {
    totalReports: visits.length,
    thisMonthReports: visits.filter((visit) => {
      const d = new Date(visit.scheduledAt)
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear
    }).length,
    pendingReports: visits.filter((visit) => visit.recordStatus === "pending-report").length,
    followUpDue: visits.filter(hasPendingOrders).length,
  }
}

export function sortVisitsByScheduledAtDesc<T extends { scheduledAt: string }>(visits: T[]): T[] {
  return [...visits].sort(
    (a, b) => Date.parse(b.scheduledAt) - Date.parse(a.scheduledAt),
  )
}

export type VisitsByDateGroup<T extends { scheduledAt: string }> = {
  dateKey: string
  dateLabel: string
  visits: T[]
}

/** Groups visits by calendar day, newest days first (assistant prescriptions timeline pattern). */
export function groupVisitsByDate<T extends { scheduledAt: string }>(
  visits: T[],
): VisitsByDateGroup<T>[] {
  const sorted = sortVisitsByScheduledAtDesc(visits)
  const byDay = new Map<string, T[]>()

  for (const visit of sorted) {
    const key = new Date(visit.scheduledAt).toDateString()
    const list = byDay.get(key) ?? []
    list.push(visit)
    byDay.set(key, list)
  }

  const groups: VisitsByDateGroup<T>[] = []
  const seen = new Set<string>()

  for (const visit of sorted) {
    const key = new Date(visit.scheduledAt).toDateString()
    if (seen.has(key)) continue
    seen.add(key)

    const dayVisits = [...(byDay.get(key) ?? [])].sort(
      (a, b) => Date.parse(b.scheduledAt) - Date.parse(a.scheduledAt),
    )

    groups.push({
      dateKey: key,
      dateLabel: formatConsultationDateShort(dayVisits[0].scheduledAt),
      visits: dayVisits,
    })
  }

  return groups
}
