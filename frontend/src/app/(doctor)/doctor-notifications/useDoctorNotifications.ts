"use client"

import { useEffect, useSyncExternalStore } from "react"

import {
  fetchNotifications,
  markAllNotificationsRead as markAllNotificationsReadApi,
} from "@/lib/notifications/notifications.api"
import { getDoctorNotificationsMock } from "./doctorNotifications.mock"
import type { DoctorNotification } from "./doctorNotifications.types"

let notifications: DoctorNotification[] = getDoctorNotificationsMock()
let hydratedFromApi = false

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

export function prependRealtimeNotification(item: DoctorNotification) {
  if (notifications.some((n) => n.id === item.id)) return
  notifications = [item, ...notifications]
  emit()
}

export function markAllDoctorNotificationsRead() {
  if (!notifications.some((notification) => !notification.read)) return

  notifications = notifications.map((notification) => ({ ...notification, read: true }))
  emit()
  void markAllNotificationsReadApi().catch(() => undefined)
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

function mapApiNotification(row: {
  id: string
  kind: string
  title?: string
  body: string
  href?: string
  read: boolean
  createdAt: string
}): DoctorNotification {
  return {
    id: row.id,
    kind: (row.kind as DoctorNotification["kind"]) ?? "system",
    title: row.title,
    body: row.body,
    href: row.href,
    createdAt: row.createdAt,
    read: row.read,
  }
}

async function hydrateFromApi() {
  if (hydratedFromApi) return
  await refreshDoctorNotificationsFromApi()
}

export async function refreshDoctorNotificationsFromApi() {
  try {
    const rows = await fetchNotifications()
    if (rows.length > 0) {
      notifications = rows.map(mapApiNotification)
      emit()
    }
  } catch {
    /* keep mock seed when API unavailable */
  } finally {
    hydratedFromApi = true
  }
}

export function useDoctorNotifications() {
  const items = useSyncExternalStore(
    subscribeDoctorNotifications,
    getDoctorNotificationsSnapshot,
    getDoctorNotificationsMock,
  )

  useEffect(() => {
    void hydrateFromApi()
  }, [])

  const unreadCount = items.filter((notification) => !notification.read).length

  return {
    notifications: items,
    unreadCount,
    markAllAsRead: markAllDoctorNotificationsRead,
    markAsRead: markDoctorNotificationRead,
    resolveAction: resolveDoctorNotificationAction,
  }
}
