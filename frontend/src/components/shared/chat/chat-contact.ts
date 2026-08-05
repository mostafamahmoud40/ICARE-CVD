import type { ChatContact } from "./chat.types"
import { resolveChatAvatarUrl } from "./chat-avatar"
import { applyCallPreview, type CallPreviewState } from "./chat-call"

export function resolveChatContact(
  contactId: string,
  apiContacts: ChatContact[],
  preview?: CallPreviewState,
): ChatContact | undefined {
  const base = apiContacts.find((contact) => contact.id === contactId)
  if (!base) return undefined
  const withAvatar: ChatContact = {
    ...base,
    avatar: resolveChatAvatarUrl(base.avatar || null),
  }
  return applyCallPreview(withAvatar, preview)
}
