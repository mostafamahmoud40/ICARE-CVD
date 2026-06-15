"use client"

import { useSyncExternalStore } from "react"

import { getDoctorNotificationsMock } from "./doctorNotifications.mock"
import type { DoctorNotification } from "./doctorNotifications.types"

let notifications: DoctorNotification[] = getDoctorNotificationsMock()

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function subscribeDoctorNotifications(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getDoctorNotificationsSnapshot() {
  return notifications
}

export function markAllDoctorNotificationsRead() {
  if (!notifications.some((notification) => !notification.read)) return

  notifications = notifications.map((notification) => ({ ...notification, read: true }))
  emit()
}

export function markDoctorNotificationRead(id: string) {
  const target = notifications.find((notification) => notification.id === id)
  if (!target || target.read) return

  notifications = notifications.map((notification) =>
    notification.id === id ? { ...notification, read: true } : notification,
  )
  emit()
}

export function resolveDoctorNotificationAction(notificationId: string, actionId: string) {
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

export function useDoctorNotifications() {
  const items = useSyncExternalStore(
    subscribeDoctorNotifications,
    getDoctorNotificationsSnapshot,
    getDoctorNotificationsMock,
  )

  const unreadCount = items.filter((notification) => !notification.read).length

  return {
    notifications: items,
    unreadCount,
    markAllAsRead: markAllDoctorNotificationsRead,
    markAsRead: markDoctorNotificationRead,
    resolveAction: resolveDoctorNotificationAction,
  }
}
