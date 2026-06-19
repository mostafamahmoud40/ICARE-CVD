"use client"

import { useEffect } from "react"
import { BellIcon } from "lucide-react"

import { showIcareToast } from "@/components/shared/icare-toast"
import { getAccessToken } from "@/lib/auth-tokens"
import type { ApiNotification } from "@/lib/notifications/notifications.api"
import { connectNotificationsSocket } from "@/lib/notifications/notifications-socket"
import { registerBrowserPush } from "@/lib/notifications/push-client"
import { prependRealtimeNotification } from "@/app/(doctor)/doctor-notifications/useDoctorNotifications"
import type { DoctorNotificationKind } from "@/app/(doctor)/doctor-notifications/doctorNotifications.types"

type NotificationsRealtimeProviderProps = {
  children: React.ReactNode
  onNotification?: (notification: ApiNotification) => void
}

export function NotificationsRealtimeProvider({
  children,
  onNotification,
}: NotificationsRealtimeProviderProps) {
  useEffect(() => {
    const token = getAccessToken()
    if (!token) return

    const handleNotification =
      onNotification ??
      ((notification: ApiNotification) => {
        prependRealtimeNotification({
          id: notification.id,
          kind: mapDoctorKind(notification.kind),
          title: notification.title,
          body: notification.body,
          href: notification.href,
          createdAt: notification.createdAt,
          read: notification.read,
        })

        showIcareToast({
          title: notification.title ?? "New notification",
          description: notification.body,
          icon: BellIcon,
          variant: "default",
        })
      })

    const disconnectSocket = connectNotificationsSocket((notification) => {
      handleNotification(notification)

      if (onNotification) {
        showIcareToast({
          title: notification.title ?? "New notification",
          description: notification.body,
          icon: BellIcon,
          variant: "default",
        })
      }
    })

    void registerBrowserPush().catch(() => {
      /* push optional until VAPID + permission */
    })

    return () => {
      disconnectSocket()
    }
  }, [onNotification])

  return children
}

function mapDoctorKind(kind: string): DoctorNotificationKind {
  const allowed = [
    "queue",
    "lab_result",
    "archive_request",
    "appointment",
    "vitals_alert",
    "prescription",
    "ai_insight",
    "system",
    "medication_flag",
  ] as const

  return allowed.includes(kind as (typeof allowed)[number])
    ? (kind as DoctorNotificationKind)
    : "system"
}
