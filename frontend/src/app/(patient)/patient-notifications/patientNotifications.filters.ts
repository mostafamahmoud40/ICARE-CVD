import type { PatientNotification, PatientNotificationKind } from "./patientNotifications.types"

export type PatientNotificationKindFilter = "all" | PatientNotificationKind

export const PATIENT_NOTIFICATION_KIND_LABELS: Record<PatientNotificationKind, string> = {
  appointment: "Appointments",
  queue: "Clinic queue",
  lab_result: "Lab results",
  vitals_alert: "Vitals & health",
  medication: "Medications",
  consultation: "Consultations",
  prescription: "Prescriptions",
  ai_insight: "Care agent",
  system: "System",
}

export const PATIENT_NOTIFICATION_KIND_OPTIONS: {
  value: PatientNotificationKindFilter
  label: string
}[] = [
  { value: "all", label: "All types" },
  ...(
    Object.entries(PATIENT_NOTIFICATION_KIND_LABELS) as [PatientNotificationKind, string][]
  ).map(([value, label]) => ({ value, label })),
]

export function filterPatientNotifications(
  items: PatientNotification[],
  kindFilter: PatientNotificationKindFilter,
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
      PATIENT_NOTIFICATION_KIND_LABELS[notification.kind],
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    return haystack.includes(query)
  })
}
