import type { AssistantNotificationKind } from "./assistantNotifications.types"

/** Notification kinds wired to the live API + realtime socket. Expand over time. */
export const ASSISTANT_NOTIFICATION_LIVE_KINDS = ["appointment"] as const satisfies readonly AssistantNotificationKind[]

export type AssistantNotificationLiveKind = (typeof ASSISTANT_NOTIFICATION_LIVE_KINDS)[number]

export function isAssistantNotificationLiveKind(
  kind: string,
): kind is AssistantNotificationLiveKind {
  return (ASSISTANT_NOTIFICATION_LIVE_KINDS as readonly string[]).includes(kind)
}

export function isLiveAssistantNotificationId(id: string) {
  return /^\d+$/.test(id)
}
