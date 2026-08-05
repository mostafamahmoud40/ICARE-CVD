export type QueueNavMode = "operations" | "schedule" | "history" | "doctors"

export const QUEUE_ROUTES: Record<QueueNavMode, string> = {
  operations: "/assistant-queue/live-desk",
  schedule: "/assistant-queue/schedule",
  history: "/assistant-queue/history",
  doctors: "/assistant-queue/doctors",
}

const PATH_TO_MODE: Record<string, QueueNavMode> = {
  "live-desk": "operations",
  schedule: "schedule",
  history: "history",
  doctors: "doctors",
}

/** @deprecated Use pathname-based routing; kept for old `?view=` links */
export function parseQueueNavMode(rawView: string | null): QueueNavMode {
  if (rawView === "schedule" || rawView === "history" || rawView === "doctors") return rawView
  if (rawView === "operations") return "operations"
  return "operations"
}

export function queueNavModeFromPathname(pathname: string): QueueNavMode {
  const segment = pathname.replace(/^\/assistant-queue\/?/, "").split("/")[0]
  if (!segment) return "operations"
  return PATH_TO_MODE[segment] ?? "operations"
}

export function queueRouteForMode(mode: QueueNavMode): string {
  return QUEUE_ROUTES[mode]
}
