import type { DoctorNotification, DoctorNotificationKind } from "./doctorNotifications.types"

export type DoctorNotificationKindFilter = "all" | DoctorNotificationKind

export const DOCTOR_NOTIFICATION_KIND_LABELS: Record<DoctorNotificationKind, string> = {
  queue: "Queue",
  lab_result: "Lab results",
  archive_request: "Archive requests",
  appointment: "Appointments",
  vitals_alert: "Vitals alerts",
  prescription: "Prescriptions",
  ai_insight: "AI insights",
  system: "System",
  medication_flag: "Medication flags",
}

export const DOCTOR_NOTIFICATION_KIND_OPTIONS: {
  value: DoctorNotificationKindFilter
  label: string
}[] = [
  { value: "all", label: "All types" },
  ...(
    Object.entries(DOCTOR_NOTIFICATION_KIND_LABELS) as [DoctorNotificationKind, string][]
  ).map(([value, label]) => ({ value, label })),
]

export function filterDoctorNotifications(
  items: DoctorNotification[],
  kindFilter: DoctorNotificationKindFilter,
  searchQuery: string,
) {
  const query = searchQuery.trim().toLowerCase()

  return items.filter((notification) => {
    if (kindFilter !== "all" && notification.kind !== kindFilter) return false
    if (!query) return true

    const haystack = [
      notification.title,
      notification.body,
      notification.sender?.name,
      DOCTOR_NOTIFICATION_KIND_LABELS[notification.kind],
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    return haystack.includes(query)
  })
}
