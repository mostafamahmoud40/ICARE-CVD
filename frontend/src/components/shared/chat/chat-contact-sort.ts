import type { ChatContact } from "./chat.types"

export function getChatContactActivityMs(contact: ChatContact): number {
  if (!contact.lastMessageAt) return 0
  const ms = new Date(contact.lastMessageAt).getTime()
  return Number.isNaN(ms) ? 0 : ms
}

export function sortChatContactsByLastActivity(contacts: ChatContact[]): ChatContact[] {
  return [...contacts].sort(
    (a, b) => getChatContactActivityMs(b) - getChatContactActivityMs(a),
  )
}
