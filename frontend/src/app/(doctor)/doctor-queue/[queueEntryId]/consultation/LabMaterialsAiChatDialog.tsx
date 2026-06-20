"use client"

import { type FormEvent, useEffect, useId, useRef, useState } from "react"
import type { LabAnalysisBundle, LabChatMessage } from "./labMaterials.types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  AlertCircleIcon,
  BotIcon,
  MessageSquareTextIcon,
  SendHorizontalIcon,
  SparklesIcon,
} from "lucide-react"

/** Internal Next.js proxy route — the Flask service is never exposed to the browser. */
const CHAT_ROUTE = "/api/medical-analyzer/chat"

const LAB_SUGGESTIONS = [
  "Summarize abnormal values",
  "Which results need urgent follow-up?",
  "Explain the clinical significance for CVD",
]

// ─── types ────────────────────────────────────────────────────────────────────

export type LabMaterialsAiChatDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  analysis: LabAnalysisBundle | null
  className?: string
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function buildWelcome(hasAnalysis: boolean): LabChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    content: hasAnalysis
      ? "Ask me anything about this lab report — abnormal values, clinical context, or follow-up priorities."
      : "Run AI structuring on a lab document first for report-specific answers. You can still ask general questions.",
  }
}

function toApiHistory(
  messages: LabChatMessage[],
): Array<{ role: string; content: string }> {
  return messages
    .filter((m) => m.id !== "welcome")
    .map((m) => ({ role: m.role, content: m.content }))
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex gap-3">
        <Avatar className="size-8 shrink-0 border border-[#E8E6E0]/60 bg-[#EEF5F3]">
          <AvatarFallback className="bg-[#1A5345]/5 text-[#1A5345]">
            <BotIcon className="size-4" aria-hidden />
          </AvatarFallback>
        </Avatar>
        <div className="flex h-10 w-14 items-center justify-center gap-1.5 rounded-2xl rounded-tl-xs border border-[#E8E6E0]/70 bg-white shadow-xs">
          <span className="size-1.5 animate-bounce rounded-full bg-[#1A5345] [animation-delay:0ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-[#1A5345] [animation-delay:150ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-[#1A5345] [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

// ─── component ────────────────────────────────────────────────────────────────

export function LabMaterialsAiChatDialog({
  open,
  onOpenChange,
  analysis,
  className,
}: LabMaterialsAiChatDialogProps) {
  const formId = useId()
  const [messages, setMessages] = useState<LabChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const [isReplying, setIsReplying] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!open) return
    setMessages((prev) => {
      if (prev.length === 0) return [buildWelcome(!!analysis)]
      return prev.map((m) =>
        m.id === "welcome" ? buildWelcome(!!analysis) : m,
      )
    })
  }, [open, analysis])

  useEffect(() => {
    if (!open) return
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, open, isReplying])

  useEffect(() => {
    if (!open) abortRef.current?.abort()
  }, [open])

  const sendText = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isReplying) return

    const userMsg: LabChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    }

    setDraft("")
    setReplyError(null)
    setMessages((m) => [...m, userMsg])
    setIsReplying(true)

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const res = await fetch(CHAT_ROUTE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          history: [...toApiHistory(messages), { role: "user", content: trimmed }],
          context: analysis ?? {},
        }),
      })

      if (!res.ok) {
        const body = await res.text().catch(() => `HTTP ${res.status}`)
        throw new Error(body || `HTTP ${res.status}`)
      }

      const data = await res.json() as { success: boolean; reply?: string; error?: string }
      if (!data.success) throw new Error(data.error ?? "Request failed")

      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply ?? "",
        },
      ])
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      setReplyError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsReplying(false)
    }
  }

  const handleSend = (e: FormEvent) => {
    e.preventDefault()
    void sendText(draft)
  }

  const showSuggestions =
    analysis &&
    messages.length === 1 &&
    messages[0]?.id === "welcome" &&
    !isReplying

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[min(640px,90vh)] w-full max-w-xl flex-col gap-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 bg-white p-0 shadow-xl",
          className,
        )}
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b border-[#E8E6E0]/60 bg-white px-5 py-4 text-left">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="min-w-0">
              <DialogTitle className="flex items-center gap-2 font-serif text-[16px] font-bold text-[#1A1F1E]">
                <MessageSquareTextIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
                Lab report assistant
              </DialogTitle>
              <DialogDescription className="mt-1 text-[13px] text-muted-foreground">
                {analysis
                  ? "Structured results loaded — ask about values, risk, or follow-up."
                  : "Analyze a lab document first for report-specific answers."}
              </DialogDescription>
            </div>
            <Badge
              variant="default"
              className="shrink-0 rounded-lg border-0 bg-[#1A5345] px-2.5 py-1 text-[11px] font-bold text-white shadow-none hover:bg-[#1A5345]"
            >
              AI · Groq
            </Badge>
          </div>
        </DialogHeader>

        <div
          ref={listRef}
          className="scrollbar-hide min-h-[280px] flex-1 space-y-4 overflow-y-auto bg-[#F9F8F5] px-5 py-4"
          dir="auto"
        >
          {messages.map((m) => {
            const isUser = m.role === "user"
            return (
              <div
                key={m.id}
                className={cn(
                  "flex animate-in fade-in slide-in-from-bottom-2 duration-300",
                  isUser ? "justify-end" : "justify-start",
                )}
              >
                <div className={cn("flex max-w-[88%] gap-3", isUser && "flex-row-reverse")}>
                  {!isUser ? (
                    <Avatar className="size-8 shrink-0 border border-[#E8E6E0]/60 bg-[#EEF5F3]">
                      <AvatarFallback className="bg-[#1A5345]/5 text-[#1A5345]">
                        <BotIcon className="size-4" aria-hidden />
                      </AvatarFallback>
                    </Avatar>
                  ) : null}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-xs",
                      isUser
                        ? "rounded-tr-xs bg-[#1A5345] text-white"
                        : "rounded-tl-xs border border-[#E8E6E0]/70 bg-white text-[#1A1F1E]",
                    )}
                    dir="auto"
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              </div>
            )
          })}

          {showSuggestions ? (
            <div className="space-y-2 border-t border-[#E8E6E0]/45 pt-4">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <SparklesIcon className="size-3.5 text-[#1A5345]" aria-hidden />
                <span className="text-[12px] font-bold text-[#102F27]">Quick prompts</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {LAB_SUGGESTIONS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendText(prompt)}
                    className="rounded-xl border border-[#E8E6E0]/60 bg-white px-3 py-2 text-left text-[12px] font-medium text-[#1A1F1E] shadow-sm transition-colors hover:bg-[#F0F7F4] hover:text-[#1A5345]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {isReplying ? <TypingIndicator /> : null}

          {replyError ? (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-[13px] text-rose-700">
              <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-rose-600" aria-hidden />
              <span>{replyError}</span>
            </div>
          ) : null}
        </div>

        <form
          id={formId}
          onSubmit={handleSend}
          className="flex shrink-0 gap-2 border-t border-[#E8E6E0]/60 bg-white p-4"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about the report results…"
            dir="auto"
            className="h-10 flex-1 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] px-4 text-[13px] text-[#1A1F1E] outline-none placeholder:text-muted-foreground focus-visible:border-[#1A5345]/40 focus-visible:ring-2 focus-visible:ring-[#1A5345]/15"
            aria-label="Message to lab assistant"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!draft.trim() || isReplying}
            className="size-10 shrink-0 rounded-lg border-0 bg-[#1A5345] text-white shadow-sm hover:bg-[#133F34] disabled:opacity-40"
            aria-label="Send message"
          >
            <SendHorizontalIcon className="size-4" aria-hidden />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
