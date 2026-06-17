"use client"

import { useEffect } from "react"
import { BellIcon } from "lucide-react"

import { showIcareToast } from "@/components/shared/icare-toast"
import { getAccessToken } from "@/lib/auth-tokens"
import type { ApiNotification } from "@/lib/notifications/notifications.api"
import { connectNotificationsSocket } from "@/lib/notifications/notifications-socket"
import { registerBrowserPush } from "@/lib/notifications/push-client"
import { prependRealtimeNotification } from "@/app/(doctor)/doctor-notifications/useDoctorNotifications"

type NotificationsRealtimeProviderProps = {
  children: React.ReactNode
}

export function NotificationsRealtimeProvider({ children }: NotificationsRealtimeProviderProps) {
  useEffect(() => {
    const token = getAccessToken()
    if (!token) return

    const handleNotification = (notification: ApiNotification) => {
      prependRealtimeNotification({
        id: notification.id,
        kind: mapKind(notification.kind),
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
    }

    const disconnectSocket = connectNotificationsSocket(handleNotification)

    void registerBrowserPush().catch(() => {
      /* push optional until VAPID + permission */
    })

    return () => {
      disconnectSocket()
    }
  }, [])

  return children
}

function mapKind(kind: string) {
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
    ? (kind as (typeof allowed)[number])
    : "system"
}
