import type { ChatMessageAttachment } from "./chat.types"

export const CHAT_LAST_MESSAGE_PHOTO = "Photo"
export const CHAT_LAST_MESSAGE_DOCUMENT = "Document"

export function isPhotoLastMessagePreview(text: string) {
  return text === CHAT_LAST_MESSAGE_PHOTO
}

export function isDocumentLastMessagePreview(text: string) {
  return text === CHAT_LAST_MESSAGE_DOCUMENT
}

export function formatChatLastMessagePreview(
  text: string,
  attachments?: ChatMessageAttachment[],
): string {
  if (attachments?.length) {
    if (attachments.every((item) => item.attachmentType === "image")) {
      return CHAT_LAST_MESSAGE_PHOTO
    }
    return CHAT_LAST_MESSAGE_DOCUMENT
  }

  const trimmed = text.trim()
  if (trimmed.startsWith("📷")) return CHAT_LAST_MESSAGE_PHOTO
  if (trimmed.startsWith("📎")) return CHAT_LAST_MESSAGE_DOCUMENT
  if (trimmed === CHAT_LAST_MESSAGE_PHOTO || trimmed === CHAT_LAST_MESSAGE_DOCUMENT) {
    return trimmed
  }
  return text
}
