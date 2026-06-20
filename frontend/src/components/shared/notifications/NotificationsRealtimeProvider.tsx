"use client"

import { useEffect } from "react"
import { BellIcon } from "lucide-react"

import { showIcareToast } from "@/components/shared/icare-toast"
import { getAccessToken } from "@/lib/auth-tokens"
import type { ApiNotification } from "@/lib/notifications/notifications.api"
import {
  clearBackgroundTabNotificationIndicator,
  markBackgroundTabNotification,
} from "@/lib/notifications/background-tab-indicator"
import {
  ICARE_NOTIFICATION_MESSAGE,
  broadcastIcareNotification,
  isIcareNotificationMessage,
  subscribeIcareNotificationBroadcast,
} from "@/lib/notifications/notifications-realtime"
import {
  connectNotificationsSocket,
  reconnectNotificationsSocket,
} from "@/lib/notifications/notifications-socket"
import { registerBrowserPush, syncBrowserPushSubscription } from "@/lib/notifications/push-client"
import { prependRealtimeNotification } from "@/app/(doctor)/doctor-notifications/useDoctorNotifications"
import type { DoctorNotificationKind } from "@/app/(doctor)/doctor-notifications/doctorNotifications.types"

const HIDDEN_TAB_POLL_MS = 12_000

type NotificationsRealtimeProviderProps = {
  children: React.ReactNode
  onNotification?: (notification: ApiNotification) => void
  onRefresh?: () => void | Promise<void>
}

export function NotificationsRealtimeProvider({
  children,
  onNotification,
  onRefresh,
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
      })

    const deliverNotification = (
      notification: ApiNotification,
      options?: { fromBroadcast?: boolean },
    ) => {
      if (!notification.id) return

      handleNotification(notification)

      if (!options?.fromBroadcast) {
        broadcastIcareNotification(notification)
      }

      if (document.visibilityState === "hidden") {
        markBackgroundTabNotification()
      }

      if (document.visibilityState === "visible" && !options?.fromBroadcast) {
        showIcareToast({
          title: notification.title ?? "New notification",
          description: notification.body,
          icon: BellIcon,
          variant: "default",
        })
      }
    }

    const onRealtimeMessage = (event: MessageEvent) => {
      if (!isIcareNotificationMessage(event.data)) return
      if (event.data.type !== ICARE_NOTIFICATION_MESSAGE) return
      deliverNotification(event.data.notification)
    }

    const disconnectSocket = connectNotificationsSocket((notification) => {
      deliverNotification(notification)
    })

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        clearBackgroundTabNotificationIndicator()
        reconnectNotificationsSocket()
        void onRefresh?.()
        return
      }

      void onRefresh?.()
    }

    const unsubscribeBroadcast = subscribeIcareNotificationBroadcast((notification) => {
      deliverNotification(notification, { fromBroadcast: true })
    })

    window.addEventListener("message", onRealtimeMessage)
    navigator.serviceWorker?.addEventListener("message", onRealtimeMessage)
    document.addEventListener("visibilitychange", onVisibilityChange)

    const hiddenPoll = window.setInterval(() => {
      if (document.visibilityState === "hidden") {
        void onRefresh?.()
      }
    }, HIDDEN_TAB_POLL_MS)

    void (async () => {
      const registered = await syncBrowserPushSubscription().catch(() => false)
      if (!registered) {
        await registerBrowserPush().catch(() => undefined)
      }
    })()

    return () => {
      disconnectSocket()
      unsubscribeBroadcast()
      window.removeEventListener("message", onRealtimeMessage)
      navigator.serviceWorker?.removeEventListener("message", onRealtimeMessage)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.clearInterval(hiddenPoll)
      clearBackgroundTabNotificationIndicator()
    }
  }, [onNotification, onRefresh])

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
