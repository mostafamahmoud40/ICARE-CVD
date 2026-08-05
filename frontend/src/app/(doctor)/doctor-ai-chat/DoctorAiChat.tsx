"use client"

import * as React from "react"
import { SendIcon, BotIcon, UserIcon, LoaderIcon, StethoscopeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DoctorChatDisplayMessage } from "./doctor-ai-chat.types"

interface DoctorAiChatProps {
  messages: DoctorChatDisplayMessage[]
  onSendMessage: (text: string) => void
  isAssistantTyping: boolean
}

const SUGGESTIONS = [
  {
    title: "Patient summary",
    desc: "Overview of all patients and their risk levels.",
    query: "أعطني ملخص سريع لكل مرضاي ومستوى الخطر لكل واحد",
  },
  {
    title: "High-risk patients",
    desc: "List patients who need urgent follow-up.",
    query: "من هم المرضى عندي بمستوى خطر عالي أو معدلات غير طبيعية؟",
  },
  {
    title: "Medication review",
    desc: "Check compliance and active prescriptions.",
    query: "أي المرضى عندهم مشكلة في الالتزام بالأدوية؟",
  },
  {
    title: "Recent AI analyses",
    desc: "Echo, ECG, X-ray and Cine-MRI findings.",
    query: "اعرض لي أهم نتائج تحليلات الـ AI الأخيرة لمرضاي",
  },
]

function renderMessageText(text: string) {
  if (text === "…") return <span className="animate-pulse">•••</span>

  const lines = text.split("\n")
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*.*?\*\*)/g)
    const rendered = parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={j} className="font-semibold text-[#1A1F1E]">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return <span key={j}>{part}</span>
    })
    return (
      <React.Fragment key={i}>
        {rendered}
        {i < lines.length - 1 && <br />}
      </React.Fragment>
    )
  })
}

function UserBubble({ message }: { message: DoctorChatDisplayMessage }) {
  return (
    <div className="flex items-end justify-end gap-2">
      <div className="max-w-[72%]">
        <div className="rounded-2xl rounded-br-xs bg-[#1A5345] px-4 py-2.5 text-[13.5px] leading-relaxed text-white shadow-sm">
          {message.text}
        </div>
        {message.time && (
          <p className="mt-1 text-right text-[10px] text-muted-foreground">{message.time}</p>
        )}
      </div>
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#E8F0EE] ring-1 ring-[#1A5345]/10 mb-4">
        <UserIcon className="size-3.5 text-[#1A5345]" />
      </div>
    </div>
  )
}

function AssistantBubble({ message }: { message: DoctorChatDisplayMessage }) {
  const isTyping = message.text === "…"
  return (
    <div className="flex items-end gap-2">
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full ring-1 mb-4",
          isTyping
            ? "bg-[#F6FBF9] ring-[#1A5345]/20"
            : "bg-[#1A5345]/8 ring-[#1A5345]/15",
        )}
      >
        <StethoscopeIcon
          className={cn("size-3.5", isTyping ? "text-[#1A5345]/50 animate-pulse" : "text-[#1A5345]")}
        />
      </div>
      <div className="max-w-[78%]">
        <div
          className={cn(
            "rounded-2xl rounded-tl-xs border border-[#E8E6E0]/70 px-4 py-3 text-[13.5px] leading-relaxed text-[#1A1F1E] shadow-xs",
            isTyping ? "bg-[#FAFAF8] italic text-muted-foreground" : "bg-[#FAFAF8]",
          )}
        >
          {renderMessageText(message.text)}
        </div>
        {!isTyping && message.time && (
          <p className="mt-1 text-[10px] text-muted-foreground">{message.time}</p>
        )}
      </div>
    </div>
  )
}

export function DoctorAiChat({ messages, onSendMessage, isAssistantTyping }: DoctorAiChatProps) {
  const [input, setInput] = React.useState("")
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const isEmpty = messages.length === 0

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || isAssistantTyping) return
    onSendMessage(trimmed)
    setInput("")
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-[#F9F8F5]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#E8E6E0]/60 bg-white px-5 py-3.5 shadow-xs">
        <div className="flex size-9 items-center justify-center rounded-xl bg-[#1A5345]/8">
          <BotIcon className="size-5 text-[#1A5345]" />
        </div>
        <div>
          <p className="text-[14.5px] font-bold text-[#1A1F1E]">ICARE Doctor Assistant</p>
          <p className="text-[11px] text-muted-foreground">Full patient panel · read-only clinical AI</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Live
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-5 custom-scrollbar"
      >
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-6">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#1A5345]/8 shadow-inner">
              <StethoscopeIcon className="size-7 text-[#1A5345]" />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-semibold text-[#1A1F1E]">Doctor Assistant</p>
              <p className="mt-1 text-[12px] text-muted-foreground max-w-xs">
                Ask me anything about your patients — history, medications, lab results, AI analyses, and more.
              </p>
            </div>
            <div className="grid w-full max-w-lg grid-cols-2 gap-2.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => onSendMessage(s.query)}
                  className="rounded-xl border border-[#E8E6E0]/80 bg-white px-3.5 py-3 text-left transition-colors hover:border-[#1A5345]/30 hover:bg-[#F6FBF9]"
                >
                  <p className="text-[12px] font-semibold text-[#1A1F1E]">{s.title}</p>
                  <p className="mt-0.5 text-[10.5px] text-muted-foreground">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {messages.map((msg) =>
              msg.role === "user" ? (
                <UserBubble key={msg.id} message={msg} />
              ) : (
                <AssistantBubble key={msg.id} message={msg} />
              ),
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-[#E8E6E0]/60 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-end gap-2.5 rounded-2xl border border-[#E8E6E0]/80 bg-[#FAFAF8] px-4 py-2.5 shadow-xs focus-within:border-[#1A5345]/40 focus-within:ring-2 focus-within:ring-[#1A5345]/8 transition-all">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your patients, diagnoses, medications, AI results…"
            disabled={isAssistantTyping}
            className="flex-1 resize-none bg-transparent text-[13.5px] leading-relaxed text-[#1A1F1E] placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50"
            style={{ maxHeight: "120px", overflowY: "auto" }}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isAssistantTyping}
            className="size-8 shrink-0 rounded-xl bg-[#1A5345] text-white shadow-sm hover:bg-[#0F3D32] disabled:opacity-40"
          >
            {isAssistantTyping ? (
              <LoaderIcon className="size-3.5 animate-spin" />
            ) : (
              <SendIcon className="size-3.5" />
            )}
          </Button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground/60">
          Read-only · cannot book or modify records · AI may make mistakes — always verify clinically
        </p>
      </div>
    </div>
  )
}
