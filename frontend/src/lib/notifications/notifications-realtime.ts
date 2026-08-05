export const ICARE_NOTIFICATION_MESSAGE = "icare:notification" as const

const ICARE_NOTIFICATION_CHANNEL = "icare-notifications"

export type IcareNotificationMessage = {
  type: typeof ICARE_NOTIFICATION_MESSAGE
  notification: {
    id: string
    kind: string
    title?: string
    body: string
    href?: string
    read: boolean
    createdAt: string
  }
}

export function isIcareNotificationMessage(data: unknown): data is IcareNotificationMessage {
  if (!data || typeof data !== "object") return false
  const record = data as Record<string, unknown>
  if (record.type !== ICARE_NOTIFICATION_MESSAGE) return false
  const notification = record.notification
  if (!notification || typeof notification !== "object") return false
  const n = notification as Record<string, unknown>
  return typeof n.id === "string" && typeof n.body === "string"
}

export function broadcastIcareNotification(notification: IcareNotificationMessage["notification"]) {
  if (typeof BroadcastChannel === "undefined") return

  const channel = new BroadcastChannel(ICARE_NOTIFICATION_CHANNEL)
  channel.postMessage({
    type: ICARE_NOTIFICATION_MESSAGE,
    notification,
  } satisfies IcareNotificationMessage)
  channel.close()
}

export function subscribeIcareNotificationBroadcast(
  onNotification: (notification: IcareNotificationMessage["notification"]) => void,
) {
  if (typeof BroadcastChannel === "undefined") return () => {}

  const channel = new BroadcastChannel(ICARE_NOTIFICATION_CHANNEL)
  channel.onmessage = (event: MessageEvent) => {
    if (!isIcareNotificationMessage(event.data)) return
    onNotification(event.data.notification)
  }

  return () => channel.close()
}
