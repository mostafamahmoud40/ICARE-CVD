"use client"

import { useState, useRef, useEffect } from "react"
import { useTranslations } from "next-intl"
import { 
  PhoneIcon, 
  VideoIcon, 
  SearchIcon, 
  PinIcon, 
  MoreVerticalIcon, 
  PlusIcon,
  SmileIcon,
  MicIcon,
  SendIcon,
  MessageCircleIcon,
  FileIcon,
  DownloadIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  callMetaFromLabel,
  type CallKind,
} from "./chat-call"
import { getAuthUser } from "@/lib/auth-tokens"
import { formatFileSize } from "./chat-api"
import { resolveChatAttachmentUrl } from "./chat-attachment-url"
import { CHAT_ATTACHMENT_ACCEPT } from "./use-chat-attachment-upload"
import type {
  ChatContact,
  ChatMessage,
  ChatOutgoingAttachment,
  SendChatMessageInput,
} from "./chat.types"

function nameInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function isAutoAttachmentLabel(text: string) {
  return text.startsWith("📷") || text.startsWith("📎")
}

function canDeleteMessage(msg: ChatMessage) {
  const numericId = Number(msg.id)
  return msg.isSender && Number.isFinite(numericId) && numericId > 0
}

type ImagePreviewState = {
  url: string
  fileName: string
}

type PendingAttachment = {
  file: File
  previewUrl: string | null
  attachmentType: "image" | "file"
}

function inferPendingAttachmentType(file: File): "image" | "file" {
  if (file.type.startsWith("image/")) return "image"
  const extension = file.name.split(".").pop()?.toLowerCase()
  if (extension && ["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) {
    return "image"
  }
  return "file"
}

interface ChatWindowProps {
  activeContact: ChatContact | undefined
  messages: ChatMessage[]
  currentUserAvatar?: string
  onSendMessage: (input: SendChatMessageInput) => void | Promise<void>
  onUploadAttachment?: (file: File) => Promise<ChatOutgoingAttachment>
  isUploadingAttachment?: boolean
  onDeleteMessage?: (messageId: string) => void | Promise<void>
  onTypingChange?: (isTyping: boolean) => void
  onToggleInfo?: () => void
  onInitiateCall?: (contactId: string, kind: CallKind) => void
}

export function ChatWindow({
  activeContact,
  messages,
  currentUserAvatar = "",
  onSendMessage,
  onUploadAttachment,
  isUploadingAttachment = false,
  onDeleteMessage,
  onTypingChange,
  onToggleInfo,
  onInitiateCall,
}: ChatWindowProps) {
  const t = useTranslations("chat")
  const [inputText, setInputText] = useState("")
  const [previewImage, setPreviewImage] = useState<ImagePreviewState | null>(null)
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!previewImage) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewImage(null)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [previewImage])

  const activeMessages = messages

  // Scroll to bottom when messages list changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activeMessages])

  useEffect(() => {
    return () => {
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current)
      onTypingChange?.(false)
    }
  }, [activeContact?.id, onTypingChange])

  useEffect(() => {
    setPendingAttachment((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl)
      return null
    })
    setInputText("")
  }, [activeContact?.id])

  useEffect(() => {
    return () => {
      if (pendingAttachment?.previewUrl) {
        URL.revokeObjectURL(pendingAttachment.previewUrl)
      }
    }
  }, [pendingAttachment?.previewUrl])

  const clearPendingAttachment = () => {
    setPendingAttachment((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl)
      return null
    })
  }

  const scheduleTypingStop = () => {
    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current)
    typingStopTimerRef.current = setTimeout(() => {
      onTypingChange?.(false)
    }, 2000)
  }

  const handleInputChange = (value: string) => {
    setInputText(value)
    if (!onTypingChange) return

    if (value.trim()) {
      onTypingChange(true)
      scheduleTypingStop()
    } else {
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current)
      onTypingChange(false)
    }
  }

  if (!activeContact) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-[#FAFAF8] text-muted-foreground border border-[#E8E6E0]/60 rounded-2xl">
        <div className="mb-4 flex size-24 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#E5EEEA]">
          <MessageCircleIcon className="size-10 text-[#1A5345]/40" />
        </div>
        <h3 className="text-lg font-semibold text-[#1A1F1E]/70">{t("empty.title")}</h3>
        <p className="mt-2 max-w-[260px] text-center text-[13px] text-muted-foreground">
          {t("empty.subtitle")}
        </p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = inputText.trim()

    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current)
    onTypingChange?.(false)

    if (pendingAttachment && onUploadAttachment) {
      try {
        const uploaded = await onUploadAttachment(pendingAttachment.file)
        await onSendMessage({
          text: text || undefined,
          attachments: [uploaded],
        })
        clearPendingAttachment()
        setInputText("")
      } catch {
        // Toast handled in upload hook
      }
      return
    }

    if (!text) return

    await onSendMessage({ text })
    setInputText("")
  }

  const handlePickAttachment = () => {
    if (isUploadingAttachment) return
    fileInputRef.current?.click()
  }

  const handleAttachmentSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || !activeContact) return

    setPendingAttachment((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl)
      const attachmentType = inferPendingAttachmentType(file)
      return {
        file,
        previewUrl: attachmentType === "image" ? URL.createObjectURL(file) : null,
        attachmentType,
      }
    })
  }

  const handleInitiateCall = (kind: CallKind) => {
    if (!activeContact) return
    onInitiateCall?.(activeContact.id, kind)
  }

  const initials = activeContact.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
  const currentUser = getAuthUser()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F9F8F5] relative border border-[#E8E6E0]/60 rounded-2xl shadow-sm">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1A5345 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Header */}
      <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-[#E8E6E0]/60 bg-white px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <Avatar className="size-14 border border-slate-100 shadow-2xs relative bg-white">
              <AvatarImage src={activeContact.avatar} alt={activeContact.name} />
              <AvatarFallback className="bg-[#1A5345]/10 text-[#1A5345] font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            {activeContact.online && (
              <span className="absolute bottom-0.5 end-0 size-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-[17px] font-bold text-[#1A1F1E]">{activeContact.name}</h3>
            {activeContact.isTyping ? (
              <p className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground">
                {t("status.typing")}
                <span className="flex items-center gap-0.5 ms-0.5">
                  <span className="size-1 rounded-full bg-muted-foreground/60 animate-bounce" />
                  <span className="size-1 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="size-1 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </p>
            ) : activeContact.online ? (
              <p className="text-[13px] font-medium text-emerald-600">{t("status.online")}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 text-[#4F6D64]">
          <button type="button" className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-slate-100 hover:text-[#1A1F1E] cursor-pointer">
            <Volume2Icon className="size-5" />
          </button>
          <button type="button" className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-slate-100 hover:text-[#1A1F1E] cursor-pointer">
            <SearchIcon className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => handleInitiateCall("voice")}
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-slate-100 hover:text-[#1A1F1E] cursor-pointer"
            aria-label={t("actions.startVoiceCall")}
          >
            <PhoneIcon className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => handleInitiateCall("video")}
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-slate-100 hover:text-[#1A1F1E] cursor-pointer"
            aria-label={t("actions.startVideoCall")}
          >
            <VideoIcon className="size-5" />
          </button>
          <button type="button" className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-slate-100 hover:text-[#1A1F1E] cursor-pointer">
            <PinIcon className="size-5" />
          </button>
          <div className="mx-1 h-6 w-px bg-transparent" />
          <button
            type="button"
            onClick={onToggleInfo}
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-slate-100 hover:text-[#1A1F1E] cursor-pointer"
          >
            <MoreVerticalIcon className="size-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="relative z-0 min-h-0 flex-1 overflow-y-auto px-6 py-4 custom-scrollbar space-y-4">
        {activeMessages.map((msg) => {
          const callMeta = callMetaFromLabel(msg.text)
          if (callMeta) {
            return (
              <MissedCallEvent
                key={msg.id}
                kind={callMeta.kind}
                direction={callMeta.direction}
                time={msg.time}
              />
            )
          }

          const isSender = msg.isSender
          const senderName = isSender ? (currentUser?.name ?? t("composer.you")) : activeContact.name
          const avatarUrl = isSender ? currentUserAvatar : activeContact.avatar
          const avatarInitials = nameInitials(senderName)

          const imageAttachments =
            msg.attachments?.filter((item) => item.attachmentType === "image") ?? []
          const fileAttachments =
            msg.attachments?.filter((item) => item.attachmentType === "file") ?? []
          const hasRealAttachments = Boolean(msg.attachments?.length)
          const showCaption =
            Boolean(msg.text?.trim()) && !isAutoAttachmentLabel(msg.text)
          const showAttachmentPlaceholder =
            !hasRealAttachments && isAutoAttachmentLabel(msg.text)

          return (
            <div key={msg.id} className={`flex w-full mb-6 gap-3 ${isSender ? "justify-end" : "justify-start"}`}>
              {/* Avatar Left (Incoming) */}
              {!isSender && (
                <div className="relative size-8 shrink-0 pt-1">
                  <Avatar className="size-8 border border-slate-100 shadow-sm ring-1 ring-black/5">
                    <AvatarImage src={avatarUrl} alt={senderName} />
                    <AvatarFallback className="bg-[#1A5345]/10 text-[#1A5345] text-[10px] font-semibold">
                      {avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}

              {/* Message Column */}
              <div className={`flex flex-col min-w-0 max-w-[75%] ${isSender ? "items-end" : "items-start"}`}>
                {/* Header */}
                <div className={`mb-1.5 flex items-center gap-2 ${isSender ? "flex-row-reverse" : "flex-row"}`}>
                  <span className="text-[12px] font-medium text-[#1A1F1E]">{senderName}</span>
                  {canDeleteMessage(msg) && onDeleteMessage ? (
                    <button
                      type="button"
                      onClick={() => void onDeleteMessage(msg.id)}
                      className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
                      aria-label={t("actions.deleteMessage")}
                    >
                      <Trash2Icon className="size-3.5" />
                    </button>
                  ) : null}
                </div>

                {/* Content rendering */}
                {hasRealAttachments ? (
                  <div className="flex flex-col gap-2">
                    {imageAttachments.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 max-w-[320px]">
                        {imageAttachments.map((attachment) => {
                          const imageUrl = resolveChatAttachmentUrl(attachment.url)
                          return (
                          <button
                            key={attachment.id}
                            type="button"
                            onClick={() =>
                              setPreviewImage({
                                url: imageUrl,
                                fileName: attachment.fileName,
                              })
                            }
                            className="group relative h-[140px] w-[150px] overflow-hidden rounded-xl border border-[#E8E6E0] bg-white shadow-sm transition-transform duration-300 hover:scale-[1.02] hover:shadow-md cursor-pointer"
                            aria-label={t("actions.openImage", { fileName: attachment.fileName })}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imageUrl}
                              alt={attachment.fileName}
                              className="size-full object-cover"
                            />
                          </button>
                          )
                        })}
                      </div>
                    ) : null}
                    {fileAttachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={resolveChatAttachmentUrl(attachment.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center gap-3 rounded-xl border border-[#E5EEEA] bg-white px-4 py-3 max-w-[280px] shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#1A5345]/20"
                      >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#F5F5F3] group-hover:bg-[#1A5345]/10">
                          <FileIcon className="size-5 text-[#6B7870] group-hover:text-[#1A5345]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-[#1A1F1E]">
                            {attachment.fileName}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatFileSize(attachment.sizeBytes)}
                          </p>
                        </div>
                        <DownloadIcon className="size-4 shrink-0 text-muted-foreground group-hover:text-[#1A5345]" />
                      </a>
                    ))}
                    {showCaption ? (
                      <div
                        className={`relative w-fit max-w-full min-w-[120px] px-4 pt-2.5 pb-6 text-[14px] leading-relaxed shadow-sm ${
                          isSender
                            ? "bg-[#EEF2F6] rounded-2xl rounded-tr-xs text-[#1A1F1E]"
                            : "bg-white border border-[#E8E6E0]/80 rounded-2xl rounded-tl-xs text-[#1A1F1E]"
                        }`}
                      >
                        <p className="break-words [overflow-wrap:anywhere] whitespace-pre-wrap pr-12">
                          {msg.text}
                        </p>
                        <span className="absolute bottom-1.5 right-3 text-[11px] text-muted-foreground whitespace-nowrap">
                          {msg.time}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground px-1">{msg.time}</span>
                    )}
                  </div>
                ) : showAttachmentPlaceholder ? (
                  <div className="flex h-[140px] w-[150px] items-center justify-center rounded-xl border border-dashed border-[#E8E6E0] bg-white text-[12px] text-muted-foreground">
                    Loading attachment...
                  </div>
                ) : (
                  <div
                    className={`relative w-fit max-w-full min-w-[120px] px-4 pt-2.5 pb-6 text-[14px] leading-relaxed shadow-sm transition-all duration-200 ${
                      !isSender
                        ? "bg-white border border-[#E8E6E0]/80 rounded-2xl rounded-tl-xs text-[#1A1F1E]"
                        : "bg-[#EEF2F6] rounded-2xl rounded-tr-xs text-[#1A1F1E]"
                    }`}
                  >
                    <p className="break-words [overflow-wrap:anywhere] whitespace-pre-wrap pr-12">
                      {msg.text}
                    </p>
                    <span className="absolute bottom-1.5 right-3 text-[11px] text-muted-foreground whitespace-nowrap">
                      {msg.time}
                    </span>
                  </div>
                )}
              </div>

              {/* Avatar Right (Outgoing) */}
              {isSender && (
                <div className="relative size-8 shrink-0 pt-1">
                  <Avatar className="size-8 border border-slate-100 shadow-sm ring-1 ring-black/5">
                    <AvatarImage src={avatarUrl} alt={senderName} />
                    <AvatarFallback className="bg-[#1A5345]/10 text-[#1A5345] text-[10px] font-semibold">
                      {avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Input */}
      <div className="relative z-10 shrink-0 bg-[#F9F8F5] px-6 py-4">
        <div className="mx-auto flex max-w-4xl flex-col gap-2">
          {pendingAttachment ? (
            <div className="flex items-center gap-3 rounded-2xl border border-[#E5EEEA]/80 bg-white px-3 py-2.5 shadow-sm">
              {pendingAttachment.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pendingAttachment.previewUrl}
                  alt={pendingAttachment.file.name}
                  className="size-14 shrink-0 rounded-lg object-cover border border-[#E8E6E0]"
                />
              ) : (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-[#F5F5F3] border border-[#E8E6E0]">
                  <FileIcon className="size-6 text-[#6B7870]" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-[#1A1F1E]">
                  {pendingAttachment.file.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {pendingAttachment.attachmentType === "image"
                    ? t("composer.addCaptionHint")
                    : t("composer.addMessageHint")}
                </p>
              </div>
              <button
                type="button"
                onClick={clearPendingAttachment}
                disabled={isUploadingAttachment}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer disabled:opacity-50"
                aria-label={t("actions.removeAttachment")}
              >
                <XIcon className="size-4" />
              </button>
            </div>
          ) : null}

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 rounded-full border border-[#E5EEEA]/80 bg-white px-2 py-1.5 shadow-[0_8px_30px_rgba(26,83,69,0.06)] transition-all duration-300 focus-within:border-[#1A5345]/40 focus-within:ring-4 focus-within:ring-[#1A5345]/10 hover:border-[#1A5345]/30"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={CHAT_ATTACHMENT_ACCEPT}
            className="hidden"
            onChange={handleAttachmentSelected}
          />
          <button
            type="button"
            onClick={handlePickAttachment}
            disabled={isUploadingAttachment}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1A5345]/10 text-[#1A5345] transition-all duration-200 hover:bg-[#1A5345] hover:text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlusIcon className="size-5" />
          </button>

          <input
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={
              pendingAttachment
                ? pendingAttachment.attachmentType === "image"
                  ? t("composer.addCaption")
                  : t("composer.addMessage")
                : t("composer.writeMessage")
            }
            className="flex-1 bg-transparent py-2.5 px-3 text-[15px] outline-none placeholder:text-muted-foreground/60 font-medium text-[#1A1F1E]"
          />

          <div className="flex items-center gap-1.5 shrink-0 pe-1">
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full text-[#6B7870] transition-colors hover:bg-[#1A5345]/10 hover:text-[#1A5345] cursor-pointer"
            >
              <SmileIcon className="size-5" />
            </button>
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full text-[#6B7870] transition-colors hover:bg-[#1A5345]/10 hover:text-[#1A5345] cursor-pointer"
            >
              <MicIcon className="size-5" />
            </button>
            <button
              type="submit"
              disabled={isUploadingAttachment || (!inputText.trim() && !pendingAttachment)}
              className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1A5345] to-[#0F3D32] text-white shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SendIcon className="size-[18px] ms-0.5" />
            </button>
          </div>
        </form>
        </div>
      </div>

      {previewImage ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label={t("actions.imagePreview")}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 end-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 cursor-pointer"
            aria-label={t("actions.closeImagePreview")}
          >
            <XIcon className="size-5" />
          </button>
          <div
            className="flex max-h-[90vh] max-w-[min(92vw,1100px)] flex-col items-center gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="max-w-full truncate px-2 text-center text-sm text-white/80">
              {previewImage.fileName}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage.url}
              alt={previewImage.fileName}
              className="max-h-[78vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function MissedCallEvent({
  kind,
  direction,
  time,
}: {
  kind: CallKind
  direction: "outgoing" | "incoming"
  time: string
}) {
  const t = useTranslations("chat")
  const Icon = kind === "video" ? VideoIcon : PhoneIcon
  const isOutgoing = direction === "outgoing"
  const label =
    kind === "video"
      ? isOutgoing
        ? t("call.youTriedVideo")
        : t("call.missedVideoShort")
      : isOutgoing
        ? t("call.youTriedVoice")
        : t("call.missedVoiceShort")

  return (
    <div className="flex justify-center py-2">
      <div className="flex flex-col items-center gap-1">
        <div
          className={`inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-[13px] font-semibold shadow-sm ${
            isOutgoing
              ? "border-[#E8E6E0] text-[#6B7870]"
              : "border-[#F5D0D6] text-[#E8345E]"
          }`}
        >
          <Icon className="size-4 shrink-0" strokeWidth={2} />
          {label}
        </div>
        {time ? <span className="text-[11px] font-medium text-muted-foreground">{time}</span> : null}
      </div>
    </div>
  )
}

type Volume2IconProps = React.SVGProps<SVGSVGElement>
function Volume2Icon(props: Volume2IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  )
}
