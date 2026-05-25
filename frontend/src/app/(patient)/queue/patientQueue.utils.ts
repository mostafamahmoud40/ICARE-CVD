import type { PatientQueueVisit } from "./patientQueue.types"

type QueueTimingSource = Pick<
  PatientQueueVisit,
  "averageExamMin" | "estimatedWaitMin" | "peopleAhead"
>

const DEFAULT_SLOT_MIN = 15

export function getQueueSlotMinutes(visit: QueueTimingSource): number {
  if (visit.averageExamMin != null && visit.averageExamMin > 0) {
    return visit.averageExamMin
  }
  if (
    visit.estimatedWaitMin != null &&
    visit.peopleAhead != null &&
    visit.peopleAhead > 0
  ) {
    return Math.max(1, Math.round(visit.estimatedWaitMin / visit.peopleAhead))
  }
  return DEFAULT_SLOT_MIN
}

/** Minutes still ahead once the alert threshold is reached (N patients × slot length). */
export function estimateWaitAtAheadThreshold(aheadThreshold: number, slotMinutes: number): number {
  return Math.max(slotMinutes, aheadThreshold * slotMinutes)
}

export function formatQueueWaitMinutes(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return hours === 1 ? "~1 hr" : `~${hours} hr`
  return hours === 1 ? `~1 hr ${mins} min` : `~${hours} hr ${mins} min`
}

export function formatApproxCallTime(fromNowMinutes: number, now = new Date()): string {
  const at = new Date(now.getTime() + fromNowMinutes * 60_000)
  return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(at)
}

export function aheadThresholdAppliesNow(
  aheadThreshold: number,
  peopleAhead: number | null,
): boolean {
  return peopleAhead !== null && peopleAhead <= aheadThreshold
}
