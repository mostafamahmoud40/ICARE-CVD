"use client"

import { useEffect, useSyncExternalStore } from "react"

import {
  fetchNotifications,
  markAllNotificationsRead as markAllNotificationsReadApi,
  markNotificationRead as markNotificationReadApi,
} from "@/lib/notifications/notifications.api"
import type { AssistantNotification, AssistantNotificationKind } from "./assistantNotifications.types"

let notifications: AssistantNotification[] = []
let hydratedFromApi = false

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function setNotifications(next: AssistantNotification[]) {
  notifications = next
  emit()
}

export function subscribeAssistantNotifications(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getAssistantNotificationsSnapshot() {
  return notifications
}

export function getAssistantNotificationsServerSnapshot() {
  return notifications
}

export function prependAssistantRealtimeNotification(item: AssistantNotification) {
  if (!item.id) return
  if (notifications.some((n) => n.id === item.id)) return

  setNotifications([item, ...notifications.filter((n) => n.id !== item.id)])
}

export function markAllAssistantNotificationsRead() {
  if (!notifications.some((notification) => !notification.read)) return

  notifications = notifications.map((notification) => ({ ...notification, read: true }))
  emit()
  void markAllNotificationsReadApi().catch(() => undefined)
}

export function markAssistantNotificationRead(id: string) {
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

const ASSISTANT_KINDS: AssistantNotificationKind[] = [
  "emergency",
  "queue",
  "appointment",
  "procedure",
  "doctor_message",
  "checklist",
  "document",
  "system",
]

function mapKind(kind: string): AssistantNotificationKind {
  if (ASSISTANT_KINDS.includes(kind as AssistantNotificationKind)) {
    return kind as AssistantNotificationKind
  }
  if (kind === "message") return "doctor_message"
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
}): AssistantNotification {
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
  await refreshAssistantNotificationsFromApi()
}

export async function refreshAssistantNotificationsFromApi() {
  try {
    const rows = await fetchNotifications()
    setNotifications(rows.map(mapApiNotification))
  } catch {
    /* keep current list when API unavailable */
  } finally {
    hydratedFromApi = true
  }
}

export function useAssistantNotifications() {
  const items = useSyncExternalStore(
    subscribeAssistantNotifications,
    getAssistantNotificationsSnapshot,
    getAssistantNotificationsServerSnapshot,
  )

  useEffect(() => {
    void hydrateFromApi()
  }, [])

  const unreadCount = items.filter((notification) => !notification.read).length

  return {
    notifications: items,
    unreadCount,
    markAllAsRead: markAllAssistantNotificationsRead,
    markAsRead: markAssistantNotificationRead,
    resolveAction: resolveAssistantNotificationAction,
  }
}
