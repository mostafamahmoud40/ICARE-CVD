import { apiClient } from "@/lib/api-client"

export type ApiNotification = {
  id: string
  kind: string
  title?: string
  body: string
  href?: string
  read: boolean
  createdAt: string
  metadata?: Record<string, unknown> | null
}

export async function fetchNotifications() {
  const { data } = await apiClient.get<ApiNotification[]>("/notifications")
  return data
}

export async function fetchVapidPublicKey() {
  const { data } = await apiClient.get<{ publicKey: string | null }>(
    "/notifications/vapid-public-key",
  )
  return data.publicKey
}

export async function savePushSubscription(subscription: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}) {
  await apiClient.post("/notifications/push-subscriptions", {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  })
}

export async function markNotificationRead(id: string) {
  await apiClient.patch(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead() {
  await apiClient.patch("/notifications/read-all")
}

export async function sendTestNotification(body: {
  title?: string
  body: string
  href?: string
  kind?: string
}) {
  const { data } = await apiClient.post<ApiNotification>("/notifications/test", body)
  return data
}
