import type { QueuePatient } from "./assistantQueue.types"

export type DoctorLiveSnapshot = {
  key: string
  doctorName: string
  department: string
  /** Rooms reported on active consultations for this doctor (deduped). */
  roomHints: string[]
  inConsultation: QueuePatient[]
  waitingOrdered: QueuePatient[]
  arrivedOrdered: QueuePatient[]
  scheduledOrdered: QueuePatient[]
  /** Who should be seen next for this doctor: waiting first, then arrived prep. */
  nextPatient: QueuePatient | null
}

function priorityRank(p: QueuePatient): number {
  if (p.priority === "emergency") return 0
  if (p.priority === "urgent") return 1
  return 2
}

function comparePriorityThenTime(
  a: QueuePatient,
  b: QueuePatient,
  timeA: number,
  timeB: number,
): number {
  const pr = priorityRank(a) - priorityRank(b)
  if (pr !== 0) return pr
  return timeA - timeB
}

export function sortWaitingPatients(a: QueuePatient, b: QueuePatient): number {
  const ta = a.waitingSince ? Date.parse(a.waitingSince) : 0
  const tb = b.waitingSince ? Date.parse(b.waitingSince) : 0
  return comparePriorityThenTime(a, b, ta, tb)
}

export function sortArrivedPatients(a: QueuePatient, b: QueuePatient): number {
  const ta = a.arrivedAt ? Date.parse(a.arrivedAt) : 0
  const tb = b.arrivedAt ? Date.parse(b.arrivedAt) : 0
  return comparePriorityThenTime(a, b, ta, tb)
}

export function sortScheduledPatients(a: QueuePatient, b: QueuePatient): number {
  return Date.parse(a.scheduledTime) - Date.parse(b.scheduledTime)
}

export function buildDoctorLiveSnapshots(patients: QueuePatient[]): DoctorLiveSnapshot[] {
  const floorPatients = patients.filter((p) =>
    ["scheduled", "arrived", "waiting", "in-consultation"].includes(p.status),
  )

  const byKey = new Map<string, QueuePatient[]>()
  for (const p of floorPatients) {
    const key = `${p.assignedDoctor}\u0000${p.assignedDoctorDepartment}`
    const arr = byKey.get(key) ?? []
    arr.push(p)
    byKey.set(key, arr)
  }

  const snapshots: DoctorLiveSnapshot[] = []

  for (const [key, list] of byKey) {
    const [doctorName = "Unknown", department = ""] = key.split("\u0000")

    const inConsultation = list.filter((p) => p.status === "in-consultation")
    const waitingOrdered = list.filter((p) => p.status === "waiting").sort(sortWaitingPatients)
    const arrivedOrdered = list.filter((p) => p.status === "arrived").sort(sortArrivedPatients)
    const scheduledOrdered = list.filter((p) => p.status === "scheduled").sort(sortScheduledPatients)

    const rooms = [
      ...new Set(
        inConsultation
          .map((p) => p.roomNumber)
          .filter((r): r is string => Boolean(r?.trim())),
      ),
    ]

    snapshots.push({
      key,
      doctorName,
      department,
      roomHints: rooms,
      inConsultation,
      waitingOrdered,
      arrivedOrdered,
      scheduledOrdered,
      nextPatient: waitingOrdered[0] ?? arrivedOrdered[0] ?? null,
    })
  }

  return snapshots.sort((a, b) => a.doctorName.localeCompare(b.doctorName))
}

export function buildWaitingTurnMap(snapshots: DoctorLiveSnapshot[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const s of snapshots) {
    s.waitingOrdered.forEach((p, i) => map.set(p.queueEntryId, i + 1))
  }
  return map
}

/** Next patient clinic-wide: earliest waiting by priority + waitingSince; else earliest arrived. */
export function getClinicNextPatient(patients: QueuePatient[]): QueuePatient | null {
  const waiting = patients.filter((p) => p.status === "waiting").sort(sortWaitingPatients)
  if (waiting.length > 0) return waiting[0] ?? null
  const arrived = patients.filter((p) => p.status === "arrived").sort(sortArrivedPatients)
  return arrived[0] ?? null
}

export function formatShortTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(iso))
  } catch {
    return iso
  }
}
