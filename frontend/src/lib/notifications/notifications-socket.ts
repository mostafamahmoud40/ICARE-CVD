import { io, type Socket } from "socket.io-client"

import { getAccessToken } from "@/lib/auth-tokens"
import type { ApiNotification } from "./notifications.api"

function socketBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_URL
  if (!raw) return undefined
  try {
    return new URL(raw).origin
  } catch {
    return raw
  }
}

let socket: Socket | null = null
const notificationListeners = new Set<(notification: ApiNotification) => void>()

function dispatchNotification(notification: ApiNotification) {
  for (const listener of notificationListeners) {
    listener(notification)
  }
}

function ensureSocket() {
  const token = getAccessToken()
  if (!token) return

  if (socket) {
    socket.auth = { token }
    if (!socket.connected) {
      socket.connect()
    }
    return
  }

  socket = io(`${socketBaseUrl()}/notifications`, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  })

  socket.on("notification:new", dispatchNotification)
}

export function connectNotificationsSocket(
  onNotification: (notification: ApiNotification) => void,
) {
  const token = getAccessToken()
  if (!token) return () => {}

  notificationListeners.add(onNotification)
  ensureSocket()

  return () => {
    notificationListeners.delete(onNotification)
  }
}

export function reconnectNotificationsSocket() {
  const token = getAccessToken()
  if (!token || !socket) return

  socket.auth = { token }
  if (socket.connected) {
    socket.disconnect()
  }
  socket.connect()
}

export function disconnectNotificationsSocket() {
  socket?.disconnect()
  socket = null
  notificationListeners.clear()
}
