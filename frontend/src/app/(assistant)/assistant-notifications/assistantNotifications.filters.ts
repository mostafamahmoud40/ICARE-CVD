import type { AssistantNotification, AssistantNotificationKind } from "./assistantNotifications.types"

export type AssistantNotificationKindFilter = "all" | AssistantNotificationKind

export const ASSISTANT_NOTIFICATION_KIND_LABELS: Record<AssistantNotificationKind, string> = {
  emergency: "Emergency",
  queue: "Queue",
  appointment: "Appointments",
  procedure: "Procedures",
  doctor_message: "Doctor messages",
  checklist: "Checklists",
  document: "Documents",
  system: "System",
}

export const ASSISTANT_NOTIFICATION_KIND_OPTIONS: {
  value: AssistantNotificationKindFilter
  label: string
}[] = [
  { value: "all", label: "All types" },
  ...(
    Object.entries(ASSISTANT_NOTIFICATION_KIND_LABELS) as [AssistantNotificationKind, string][]
  ).map(([value, label]) => ({ value, label })),
]

export function filterAssistantNotifications(
  items: AssistantNotification[],
  kindFilter: AssistantNotificationKindFilter,
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
      ASSISTANT_NOTIFICATION_KIND_LABELS[notification.kind],
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    return haystack.includes(query)
  })
}
