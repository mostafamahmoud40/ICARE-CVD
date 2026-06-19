"use client"

import { useEffect, useSyncExternalStore } from "react"

import {
  fetchNotifications,
  markAllNotificationsRead as markAllNotificationsReadApi,
  markNotificationRead as markNotificationReadApi,
} from "@/lib/notifications/notifications.api"
import {
  isLivePatientNotificationId,
  isPatientNotificationLiveKind,
} from "./patientNotifications.config"
import { getPatientNotificationsMock } from "./patientNotifications.mock"
import { mergePatientNotifications } from "./patientNotifications.merge"
import type { PatientNotification, PatientNotificationKind } from "./patientNotifications.types"

const MOCK_SEED = getPatientNotificationsMock()
let notifications: PatientNotification[] = mergePatientNotifications(MOCK_SEED, [])
let hydratedFromApi = false

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function setNotifications(next: PatientNotification[]) {
  notifications = mergePatientNotifications(MOCK_SEED, next.filter((item) => isPatientNotificationLiveKind(item.kind)))
  emit()
}

export function subscribePatientNotifications(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getPatientNotificationsSnapshot() {
  return notifications
}

const patientNotificationsServerSnapshot = mergePatientNotifications(MOCK_SEED, [])

export function getPatientNotificationsServerSnapshot() {
  return patientNotificationsServerSnapshot
}

export function prependPatientRealtimeNotification(item: PatientNotification) {
  if (!item.id) return
  if (!isPatientNotificationLiveKind(item.kind)) return
  if (notifications.some((n) => n.id === item.id)) return

  const liveItems = [
    item,
    ...notifications.filter(
      (n) => isPatientNotificationLiveKind(n.kind) && n.id !== item.id,
    ),
  ]
  setNotifications(liveItems)
}

export function markAllPatientNotificationsRead() {
  if (!notifications.some((notification) => !notification.read)) return

  notifications = notifications.map((notification) => ({ ...notification, read: true }))
  emit()
  void markAllNotificationsReadApi().catch(() => undefined)
}

export function markPatientNotificationRead(id: string) {
  const target = notifications.find((notification) => notification.id === id)
  if (!target || target.read) return

  notifications = notifications.map((notification) =>
    notification.id === id ? { ...notification, read: true } : notification,
  )
  emit()

  if (isLivePatientNotificationId(id)) {
    void markNotificationReadApi(id).catch(() => undefined)
  }
}

export function resolvePatientNotificationAction(notificationId: string, actionId: string) {
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

const PATIENT_KINDS: PatientNotificationKind[] = [
  "appointment",
  "queue",
  "lab_result",
  "vitals_alert",
  "medication",
  "consultation",
  "prescription",
  "ai_insight",
  "system",
]

function mapKind(kind: string): PatientNotificationKind {
  if (PATIENT_KINDS.includes(kind as PatientNotificationKind)) {
    return kind as PatientNotificationKind
  }
  if (kind === "medication_flag" || kind === "prescription") return "medication"
  if (kind === "vitals_alert") return "vitals_alert"
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
}): PatientNotification {
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
  await refreshPatientNotificationsFromApi()
}

export async function refreshPatientNotificationsFromApi() {
  try {
    const rows = await fetchNotifications()
    const liveItems = rows
      .map(mapApiNotification)
      .filter((item) => isPatientNotificationLiveKind(item.kind))
    setNotifications(liveItems)
  } catch {
    /* keep current list when API unavailable */
  } finally {
    hydratedFromApi = true
  }
}

export function usePatientNotifications() {
  const items = useSyncExternalStore(
    subscribePatientNotifications,
    getPatientNotificationsSnapshot,
    getPatientNotificationsServerSnapshot,
  )

  useEffect(() => {
    void hydrateFromApi()
  }, [])

  const unreadCount = items.filter((notification) => !notification.read).length

  return {
    notifications: items,
    unreadCount,
    markAllAsRead: markAllPatientNotificationsRead,
    markAsRead: markPatientNotificationRead,
    resolveAction: resolvePatientNotificationAction,
  }
}
