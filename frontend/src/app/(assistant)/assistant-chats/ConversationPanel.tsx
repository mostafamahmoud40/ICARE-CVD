"use client"

import type { FormEvent } from "react"
import { useRef, useEffect, useState } from "react"
import {
  Volume2Icon,
  SearchIcon,
  VideoIcon,
  PinIcon,
  MoreVerticalIcon,
  PlusIcon,
  SmileIcon,
  MicIcon,
  SendIcon,
  MessageCircleIcon,
} from "lucide-react"
import { MessageBubble } from "./MessageBubble"
import type { ChatMessageItem } from "./assistantChats.types"

interface ConversationPanelProps {
  contactName: string | null
  contactAvatar: string | null
  isOnline: boolean
  messages: ChatMessageItem[]
  onSendMessage: (text: string) => void
  onToggleInfo?: () => void
}

export function ConversationPanel({
  contactName,
  contactAvatar,
  isOnline,
  messages,
  onSendMessage,
  onToggleInfo,
}: ConversationPanelProps) {
  if (!contactName) {
    return <EmptyConversationState />
  }

  return (
    <div className="flex flex-1 flex-col bg-[#F9F8F5] relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1A5345 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Header */}
      <ConversationHeader
        name={contactName}
        avatarColor={contactAvatar}
        isOnline={isOnline}
        onToggleInfo={onToggleInfo}
      />

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Input */}
      <MessageInputBar onSendMessage={onSendMessage} />
    </div>
  )
}

/* ── SRP: empty state ────────────────────────────────────────── */
function EmptyConversationState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#FAFAF8] text-muted-foreground">
      <div className="mb-4 flex size-24 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#E5EEEA]">
        <MessageCircleIcon className="size-10 text-[#1A5345]/40" />
      </div>
      <h3 className="text-lg font-semibold text-[#1A1F1E]/70">Your Messages</h3>
      <p className="max-w-[260px] text-center text-[13px] mt-2 text-muted-foreground">
        Select a conversation from the sidebar to start chatting.
      </p>
    </div>
  )
}

/* ── SRP: header bar ─────────────────────────────────────────── */
function ConversationHeader({
  name,
  avatarColor,
  isOnline,
  onToggleInfo,
}: {
  name: string
  avatarColor: string | null
  isOnline: boolean
  onToggleInfo?: () => void
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)

  return (
    <div className="relative z-10 flex items-center justify-between border-b border-[#E8E6E0]/60 bg-white px-8 py-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div
            className={`flex size-14 items-center justify-center rounded-full text-white text-[17px] font-semibold ${
              avatarColor ?? "bg-[#8B5CF6]"
            }`}
          >
            {initials}
          </div>
          {isOnline && (
            <span className="absolute bottom-0.5 right-0 size-3.5 rounded-full bg-[#14B8A6] ring-[2.5px] ring-white" />
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[17px] font-bold text-[#1A1F1E]">{name}</h3>
          {isOnline && (
            <p className="text-[13px] font-medium text-[#14B8A6]">Online</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {[Volume2Icon, SearchIcon, VideoIcon, PinIcon].map((Icon, i) => (
          <button
            key={`action-${i}`}
            type="button"
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-slate-100 hover:text-[#1A1F1E]"
          >
            <Icon className="size-5" strokeWidth={1.5} />
          </button>
        ))}
        <div className="mx-1 h-6 w-px bg-transparent" />
        <button
          type="button"
          onClick={onToggleInfo}
          className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-slate-100 hover:text-[#1A1F1E]"
        >
          <MoreVerticalIcon className="size-5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}

/* ── SRP: scrollable message list ────────────────────────────── */
function MessageList({ messages }: { messages: ChatMessageItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Group messages by date divider
  const yesterdayMessages = messages.slice(0, 5)
  const todayMessages = messages.slice(5)

  return (
    <div
      ref={scrollRef}
      className="relative z-0 flex-1 overflow-y-auto px-6 pt-4 pb-32 custom-scrollbar"
    >
      {/* Yesterday divider */}
      {yesterdayMessages.length > 0 && (
        <>
          <DateDivider label="Yesterday" />
          {yesterdayMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              senderName={msg.senderName}
              time={msg.time}
              isOutgoing={msg.isOutgoing}
              contentType={msg.contentType}
              text={msg.text}
              images={msg.images}
              fileName={msg.fileName}
              fileSize={msg.fileSize}
            />
          ))}
        </>
      )}

      {/* Today divider */}
      {todayMessages.length > 0 && (
        <>
          <DateDivider label="Today" />
          {todayMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              senderName={msg.senderName}
              time={msg.time}
              isOutgoing={msg.isOutgoing}
              contentType={msg.contentType}
              text={msg.text}
              images={msg.images}
              fileName={msg.fileName}
              fileSize={msg.fileSize}
            />
          ))}
        </>
      )}
    </div>
  )
}

/* ── SRP: date divider ───────────────────────────────────────── */
function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-4">
      <span className="text-[11px] font-semibold text-[#6B7870] bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm border border-[#E8E6E0]">
        {label}
      </span>
    </div>
  )
}

/* ── SRP: message input bar ──────────────────────────────────── */
function MessageInputBar({
  onSendMessage,
}: {
  onSendMessage: (text: string) => void
}) {
  const [text, setText] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onSendMessage(text.trim())
    setText("")
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-6 pt-16 bg-gradient-to-t from-[#F9F8F5] via-[#F9F8F5]/90 to-transparent pointer-events-none">
      <form
        onSubmit={handleSubmit}
        className="pointer-events-auto mx-auto max-w-4xl flex items-center gap-2 rounded-full border border-[#E5EEEA]/80 bg-white/95 backdrop-blur-md px-2 py-1.5 shadow-[0_8px_30px_rgba(26,83,69,0.06)] transition-all duration-300 focus-within:border-[#1A5345]/40 focus-within:ring-4 focus-within:ring-[#1A5345]/10 hover:border-[#1A5345]/30"
      >
        <button
          type="button"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1A5345]/10 text-[#1A5345] transition-all duration-200 hover:bg-[#1A5345] hover:text-white"
        >
          <PlusIcon className="size-5" />
        </button>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          placeholder="Write your message..."
          className="flex-1 bg-transparent py-2.5 px-3 text-[15px] outline-none placeholder:text-muted-foreground/60 font-medium text-[#1A1F1E]"
        />

        <div className="flex items-center gap-1.5 shrink-0 pr-1">
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full text-[#6B7870] transition-colors hover:bg-[#1A5345]/10 hover:text-[#1A5345]"
          >
            <SmileIcon className="size-5" />
          </button>
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full text-[#6B7870] transition-colors hover:bg-[#1A5345]/10 hover:text-[#1A5345]"
          >
            <MicIcon className="size-5" />
          </button>
          <button
            type="submit"
            className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1A5345] to-[#0F3D32] text-white shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
          >
            <SendIcon className="size-[18px] ml-0.5" />
          </button>
        </div>
      </form>
    </div>
  )
}
