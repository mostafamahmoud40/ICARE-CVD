"use client"

import { useEffect, useSyncExternalStore } from "react"

import {
  fetchNotifications,
  markAllNotificationsRead as markAllNotificationsReadApi,
  markNotificationRead as markNotificationReadApi,
} from "@/lib/notifications/notifications.api"
import type { PatientNotification, PatientNotificationKind } from "./patientNotifications.types"

let notifications: PatientNotification[] = []
let hydratedFromApi = false

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function setNotifications(next: PatientNotification[]) {
  notifications = next
  emit()
}

export function subscribePatientNotifications(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getPatientNotificationsSnapshot() {
  return notifications
}

export function getPatientNotificationsServerSnapshot() {
  return notifications
}

export function prependPatientRealtimeNotification(item: PatientNotification) {
  if (!item.id) return
  if (notifications.some((n) => n.id === item.id)) return

  setNotifications([item, ...notifications.filter((n) => n.id !== item.id)])
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

  if (isLiveNotificationId(id)) {
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
  "message",
  "procedure",
]

function mapKind(kind: string): PatientNotificationKind {
  if (PATIENT_KINDS.includes(kind as PatientNotificationKind)) {
    return kind as PatientNotificationKind
  }
  if (kind === "medication_flag") return "medication"
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

function isLiveNotificationId(id: string) {
  return /^\d+$/.test(id)
}

async function hydrateFromApi() {
  if (hydratedFromApi) return
  await refreshPatientNotificationsFromApi()
}

export async function refreshPatientNotificationsFromApi() {
  try {
    const rows = await fetchNotifications()
    setNotifications(rows.map(mapApiNotification))
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
