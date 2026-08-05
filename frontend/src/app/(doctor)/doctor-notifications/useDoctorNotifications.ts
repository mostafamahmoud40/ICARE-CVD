"use client"

import { useEffect, useSyncExternalStore } from "react"

import {
  fetchNotifications,
  markAllNotificationsRead as markAllNotificationsReadApi,
  markNotificationRead as markNotificationReadApi,
} from "@/lib/notifications/notifications.api"
import type { DoctorNotification, DoctorNotificationKind } from "./doctorNotifications.types"

let notifications: DoctorNotification[] = []
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

export function getDoctorNotificationsServerSnapshot() {
  return notifications
}

export function prependRealtimeNotification(item: DoctorNotification) {
  if (!item.id) return
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

  if (isLiveNotificationId(id)) {
    void markNotificationReadApi(id).catch(() => undefined)
  }
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

const DOCTOR_KINDS: DoctorNotificationKind[] = [
  "queue",
  "lab_result",
  "archive_request",
  "appointment",
  "vitals_alert",
  "prescription",
  "ai_insight",
  "system",
  "medication_flag",
  "message",
]

function mapKind(kind: string): DoctorNotificationKind {
  if (DOCTOR_KINDS.includes(kind as DoctorNotificationKind)) {
    return kind as DoctorNotificationKind
  }
  if (kind === "procedure" || kind === "consultation") return "system"
  return "system"
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
    kind: mapKind(row.kind),
    title: row.title,
    body: row.body,
    href: row.href,
    createdAt: row.createdAt,
    read: row.read,
  }
}

function isLiveNotificationId(id: string) {
  return /^\d+$/.test(id)
}

async function hydrateFromApi() {
  if (hydratedFromApi) return
  await refreshDoctorNotificationsFromApi()
}

export async function refreshDoctorNotificationsFromApi() {
  try {
    const rows = await fetchNotifications()
    notifications = rows.map(mapApiNotification)
    emit()
  } catch {
    /* keep current list when API unavailable */
  } finally {
    hydratedFromApi = true
  }
}

export function useDoctorNotifications() {
  const items = useSyncExternalStore(
    subscribeDoctorNotifications,
    getDoctorNotificationsSnapshot,
    getDoctorNotificationsServerSnapshot,
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
