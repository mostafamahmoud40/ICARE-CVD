"use client"

import type { ApiNotification } from "@/lib/notifications/notifications.api"
import { isPatientNotificationLiveKind } from "@/app/(patient)/patient-notifications/patientNotifications.config"
import { prependPatientRealtimeNotification, refreshPatientNotificationsFromApi } from "@/app/(patient)/patient-notifications/usePatientNotifications"
import type { PatientNotificationKind } from "@/app/(patient)/patient-notifications/patientNotifications.types"
import { NotificationsRealtimeProvider } from "@/components/shared/notifications/NotificationsRealtimeProvider"

const PATIENT_KINDS: PatientNotificationKind[] = [
  "appointment",
  "queue",
  "lab_result",
  "vitals_alert",
  "medication",
  "consultation",
  "prescription",
  "ai_insight",
  "system",
]

function mapPatientKind(kind: string): PatientNotificationKind {
  if (PATIENT_KINDS.includes(kind as PatientNotificationKind)) {
    return kind as PatientNotificationKind
  }
  if (kind === "medication_flag") return "medication"
  return "system"
}

function handlePatientNotification(notification: ApiNotification) {
  const kind = mapPatientKind(notification.kind)
  if (!isPatientNotificationLiveKind(kind)) return

  prependPatientRealtimeNotification({
    id: notification.id,
    kind,
    title: notification.title,
    body: notification.body,
    href: notification.href,
    createdAt: notification.createdAt,
    read: notification.read,
  })
}

export function PatientNotificationsRealtimeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NotificationsRealtimeProvider
      onNotification={handlePatientNotification}
      onRefresh={refreshPatientNotificationsFromApi}
    >
      {children}
    </NotificationsRealtimeProvider>
  )
}
