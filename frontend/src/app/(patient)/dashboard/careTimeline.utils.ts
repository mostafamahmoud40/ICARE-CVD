import type { CareTimelineItem } from "./dashboard.types"

export type CareTimelineBucket = "today" | "tomorrow" | "upcoming" | "overdue"

export type GroupedCareTimeline = Record<CareTimelineBucket, CareTimelineItem[]>

const BUCKET_LABELS: Record<CareTimelineBucket, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  upcoming: "Upcoming",
  overdue: "Overdue",
}

export function getCareTimelineBucket(dueAt: string, now = new Date()): CareTimelineBucket {
  const due = new Date(dueAt)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const diffDays = Math.round(
    (startOfDue.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (diffDays < 0) return "overdue"
  if (diffDays === 0) return "today"
  if (diffDays === 1) return "tomorrow"
  return "upcoming"
}

export function groupCareTimelineItems(
  items: CareTimelineItem[],
  now = new Date(),
): GroupedCareTimeline {
  const grouped: GroupedCareTimeline = {
    today: [],
    tomorrow: [],
    upcoming: [],
    overdue: [],
  }

  for (const item of items) {
    if (item.status === "completed") continue
    const bucket =
      item.status === "missing" ? "overdue" : getCareTimelineBucket(item.dueAt, now)
    grouped[bucket].push(item)
  }

  for (const bucket of Object.keys(grouped) as CareTimelineBucket[]) {
    grouped[bucket].sort(
      (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
    )
  }

  return grouped
}

export function careTimelineBucketLabel(bucket: CareTimelineBucket): string {
  return BUCKET_LABELS[bucket]
}

export function formatCareDueDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(iso))
}
