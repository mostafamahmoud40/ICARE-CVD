import { useCallback, useState } from "react"
import { toast } from "sonner"
import { requestChatUploadIntent } from "./chat-api"
import type { ChatOutgoingAttachment } from "./chat.types"

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif"
const FILE_ACCEPT =
  "application/pdf,application/zip,application/x-zip-compressed,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

export const CHAT_ATTACHMENT_ACCEPT = `${IMAGE_ACCEPT},${FILE_ACCEPT}`

function resolveFileContentType(file: File): string {
  if (file.type) return file.type
  const extension = file.name.split(".").pop()?.toLowerCase()
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    pdf: "application/pdf",
    zip: "application/zip",
    txt: "text/plain",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }
  return extension ? map[extension] ?? "application/octet-stream" : "application/octet-stream"
}

function inferAttachmentType(file: File, contentType: string): "image" | "file" {
  if (contentType.startsWith("image/")) return "image"
  const extension = file.name.split(".").pop()?.toLowerCase()
  if (extension && ["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) {
    return "image"
  }
  return "file"
}

type UploadState = "idle" | "uploading"

export function useChatAttachmentUpload(conversationId: string) {
  const [uploadState, setUploadState] = useState<UploadState>("idle")

  const uploadAttachment = useCallback(
    async (file: File): Promise<ChatOutgoingAttachment> => {
      if (!conversationId) {
        throw new Error("Select a conversation first")
      }

      const contentType = resolveFileContentType(file)
      const attachmentType = inferAttachmentType(file, contentType)

      setUploadState("uploading")
      try {
        const intent = await requestChatUploadIntent(conversationId, {
          fileName: file.name,
          contentType,
          attachmentType,
        })

        const response = await fetch(intent.uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": contentType,
          },
        })

        if (!response.ok) {
          throw new Error(`Upload failed (${response.status})`)
        }

        return {
          fileName: file.name,
          mimeType: contentType,
          sizeBytes: file.size,
          s3Key: intent.key,
          attachmentType,
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not upload attachment"
        toast.error("Upload failed", { description: message })
        throw error
      } finally {
        setUploadState("idle")
      }
    },
    [conversationId],
  )

  return {
    uploadAttachment,
    isUploading: uploadState === "uploading",
  }
}
