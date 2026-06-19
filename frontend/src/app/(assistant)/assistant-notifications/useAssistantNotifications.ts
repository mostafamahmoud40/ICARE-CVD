"use client"

import { useEffect, useSyncExternalStore } from "react"

import {
  fetchNotifications,
  markAllNotificationsRead as markAllNotificationsReadApi,
  markNotificationRead as markNotificationReadApi,
} from "@/lib/notifications/notifications.api"
import {
  isAssistantNotificationLiveKind,
  isLiveAssistantNotificationId,
} from "./assistantNotifications.config"
import { getAssistantNotificationsMock } from "./assistantNotifications.mock"
import { mergeAssistantNotifications } from "./assistantNotifications.merge"
import type { AssistantNotification, AssistantNotificationKind } from "./assistantNotifications.types"

const MOCK_SEED = getAssistantNotificationsMock()
let notifications: AssistantNotification[] = mergeAssistantNotifications(MOCK_SEED, [])
let hydratedFromApi = false

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function setNotifications(next: AssistantNotification[]) {
  notifications = mergeAssistantNotifications(
    MOCK_SEED,
    next.filter((item) => isAssistantNotificationLiveKind(item.kind)),
  )
  emit()
}

export function subscribeAssistantNotifications(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getAssistantNotificationsSnapshot() {
  return notifications
}

const assistantNotificationsServerSnapshot = mergeAssistantNotifications(MOCK_SEED, [])

export function getAssistantNotificationsServerSnapshot() {
  return assistantNotificationsServerSnapshot
}

export function prependAssistantRealtimeNotification(item: AssistantNotification) {
  if (!item.id) return
  if (!isAssistantNotificationLiveKind(item.kind)) return
  if (notifications.some((n) => n.id === item.id)) return

  const liveItems = [
    item,
    ...notifications.filter(
      (n) => isAssistantNotificationLiveKind(n.kind) && n.id !== item.id,
    ),
  ]
  setNotifications(liveItems)
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

  if (isLiveAssistantNotificationId(id)) {
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

async function hydrateFromApi() {
  if (hydratedFromApi) return
  await refreshAssistantNotificationsFromApi()
}

export async function refreshAssistantNotificationsFromApi() {
  try {
    const rows = await fetchNotifications()
    const liveItems = rows
      .map(mapApiNotification)
      .filter((item) => isAssistantNotificationLiveKind(item.kind))
    setNotifications(liveItems)
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
