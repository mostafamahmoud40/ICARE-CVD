import { isCallActivityLabel } from "./chat-call"
import type { ChatMessage, ChatMessageAttachment } from "./chat.types"

const URL_REGEX = /https?:\/\/[^\s<>"']+/gi

export type SharedMediaItem = {
  id: string
  kind: "image" | "file" | "link"
  url: string
  fileName?: string
  sizeBytes?: number
  time?: string
}

function isAutoAttachmentLabel(text: string) {
  return text.startsWith("📷") || text.startsWith("📎")
}

function extractLinksFromText(text: string): string[] {
  const matches = text.match(URL_REGEX)
  if (!matches) return []
  return [...new Set(matches.map((url) => url.replace(/[),.]+$/, "")))]
}

function attachmentToItem(
  attachment: ChatMessageAttachment,
  message: ChatMessage,
): SharedMediaItem {
  return {
    id: `${message.id}-${attachment.id}`,
    kind: attachment.attachmentType === "image" ? "image" : "file",
    url: attachment.url,
    fileName: attachment.fileName,
    sizeBytes: attachment.sizeBytes,
    time: message.time,
  }
}

export function collectSharedMediaFromMessages(messages: ChatMessage[]) {
  const photos: SharedMediaItem[] = []
  const files: SharedMediaItem[] = []
  const links: SharedMediaItem[] = []
  const seenLinkUrls = new Set<string>()

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i]
    if (isCallActivityLabel(message.text)) continue

    for (const attachment of message.attachments ?? []) {
      const item = attachmentToItem(attachment, message)
      if (item.kind === "image") {
        photos.push(item)
      } else {
        files.push(item)
      }
    }

    const text = message.text?.trim()
    if (!text || isAutoAttachmentLabel(text)) continue

    for (const url of extractLinksFromText(text)) {
      if (seenLinkUrls.has(url)) continue
      seenLinkUrls.add(url)
      links.push({
        id: `${message.id}-link-${links.length}`,
        kind: "link",
        url,
        time: message.time,
      })
    }
  }

  return { photos, files, links }
}
