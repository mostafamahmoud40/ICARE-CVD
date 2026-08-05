"use client"

import { useSyncExternalStore } from "react"

import { getAssistantNotificationsMock } from "./assistantNotifications.mock"
import type { AssistantNotification } from "./assistantNotifications.types"

let notifications: AssistantNotification[] = getAssistantNotificationsMock()

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function subscribeAssistantNotifications(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getAssistantNotificationsSnapshot() {
  return notifications
}

export function markAllAssistantNotificationsRead() {
  if (!notifications.some((notification) => !notification.read)) return

  notifications = notifications.map((notification) => ({ ...notification, read: true }))
  emit()
}

export function markAssistantNotificationRead(id: string) {
  const target = notifications.find((notification) => notification.id === id)
  if (!target || target.read) return

  notifications = notifications.map((notification) =>
    notification.id === id ? { ...notification, read: true } : notification,
  )
  emit()
}

export function resolveAssistantNotificationAction(notificationId: string, actionId: string) {
  notifications = notifications.map((notification) => {
    if (notification.id !== notificationId) return notification

    return {
      ...notification,
      read: true,
      actions: undefined,
    }
  })
  emit()
  return { notificationId, actionId }
}

export function useAssistantNotifications() {
  const items = useSyncExternalStore(
    subscribeAssistantNotifications,
    getAssistantNotificationsSnapshot,
    getAssistantNotificationsMock,
  )

  const unreadCount = items.filter((notification) => !notification.read).length

  return {
    notifications: items,
    unreadCount,
    markAllAsRead: markAllAssistantNotificationsRead,
    markAsRead: markAssistantNotificationRead,
    resolveAction: resolveAssistantNotificationAction,
  }
}
