import type { DoctorQueueState, DoctorStatus } from "./doctors.types"

export function getDoctorQueueState(doc: DoctorStatus): DoctorQueueState {
  if (!doc.checkedInAt) return "idle"
  if (doc.isPaused) return "paused"
  if (doc.queueStartAt && new Date() >= new Date(doc.queueStartAt)) return "active"
  if (doc.queueStartAt) return "scheduled"
  return "checkedIn"
}

export function isoToTimeValue(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export function parseTimeValueToDate(timeValue: string): Date | null {
  const match = timeValue.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null

  const hours = parseInt(match[1]!, 10)
  const minutes = parseInt(match[2]!, 10)
  if (hours > 23 || minutes > 59) return null

  const now = new Date()
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatBreakDuration(pausedAt: string): string {
  const diff = Math.floor((Date.now() - new Date(pausedAt).getTime()) / 60000)
  return diff < 1 ? "just now" : `${diff} min ago`
}
