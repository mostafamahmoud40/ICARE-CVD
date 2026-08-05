import { isPatientNotificationLiveKind } from "./patientNotifications.config"
import type { PatientNotification } from "./patientNotifications.types"

function sortNewestFirst(items: PatientNotification[]) {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

/** Keep mock seeds for non-live kinds; replace live kinds with API/realtime rows. */
export function mergePatientNotifications(
  mockSeed: PatientNotification[],
  liveItems: PatientNotification[],
): PatientNotification[] {
  const liveIds = new Set(liveItems.map((item) => item.id))
  const mockWithoutLiveKinds = mockSeed.filter(
    (item) => !isPatientNotificationLiveKind(item.kind) && !liveIds.has(item.id),
  )

  return sortNewestFirst([...liveItems, ...mockWithoutLiveKinds])
}
