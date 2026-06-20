import { isAssistantNotificationLiveKind } from "./assistantNotifications.config"
import type { AssistantNotification } from "./assistantNotifications.types"

function sortNewestFirst(items: AssistantNotification[]) {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function mergeAssistantNotifications(
  mockSeed: AssistantNotification[],
  liveItems: AssistantNotification[],
): AssistantNotification[] {
  const liveIds = new Set(liveItems.map((item) => item.id))
  const mockWithoutLiveKinds = mockSeed.filter(
    (item) => !isAssistantNotificationLiveKind(item.kind) && !liveIds.has(item.id),
  )

  return sortNewestFirst([...liveItems, ...mockWithoutLiveKinds])
}
