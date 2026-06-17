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

export function connectNotificationsSocket(
  onNotification: (notification: ApiNotification) => void,
) {
  const token = getAccessToken()
  if (!token) return () => {}

  if (socket?.connected) {
    socket.off("notification:new")
    socket.on("notification:new", onNotification)
    return () => {
      socket?.off("notification:new", onNotification)
    }
  }

  socket = io(`${socketBaseUrl()}/notifications`, {
    auth: { token },
    transports: ["websocket", "polling"],
  })

  socket.on("notification:new", onNotification)

  return () => {
    socket?.off("notification:new", onNotification)
  }
}

export function disconnectNotificationsSocket() {
  socket?.disconnect()
  socket = null
}
