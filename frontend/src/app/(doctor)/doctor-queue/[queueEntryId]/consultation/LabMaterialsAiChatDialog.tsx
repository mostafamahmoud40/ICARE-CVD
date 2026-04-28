"use client"

import { type FormEvent, useEffect, useId, useRef, useState } from "react"
import type { LabAnalysisBundle, LabChatMessage } from "./labMaterials.types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { AlertCircleIcon, Loader2Icon, SendHorizontalIcon } from "lucide-react"

/** Internal Next.js proxy route — the Flask service is never exposed to the browser. */
const CHAT_ROUTE = "/api/medical-analyzer/chat"

// ─── types ────────────────────────────────────────────────────────────────────

export type LabMaterialsAiChatDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * Full structured analysis from the Medical Analyzer.
   * Sent as context to the /api/chat endpoint on every message.
   * If null (no analysis yet), the assistant still accepts general questions.
   */
  analysis: LabAnalysisBundle | null
  className?: string
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function buildWelcome(hasAnalysis: boolean): LabChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    content: hasAnalysis
      ? "Hello! You can now ask me any question about the lab report results. I will answer professionally and clearly. (Default: English / Arabic when you write in Arabic)"
      : "Add a lab document and run the analysis first for accurate answers. You can also ask me general questions.",
  }
}

/**
 * Converts our UI message list into the history array the Medical Analyzer expects.
 * The welcome seed message is excluded — it is UI chrome, not a real API turn.
 */
function toApiHistory(
  messages: LabChatMessage[],
): Array<{ role: string; content: string }> {
  return messages
    .filter((m) => m.id !== "welcome")
    .map((m) => ({ role: m.role, content: m.content }))
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

  // Seed welcome on first open; refresh it if analysis state changes
  useEffect(() => {
    if (!open) return
    setMessages((prev) => {
      if (prev.length === 0) return [buildWelcome(!!analysis)]
      // Update welcome text in-place when analysis arrives
      return prev.map((m) =>
        m.id === "welcome" ? buildWelcome(!!analysis) : m,
      )
    })
  }, [open, analysis])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (!open) return
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, open])

  // Cancel in-flight request when dialog closes
  useEffect(() => {
    if (!open) abortRef.current?.abort()
  }, [open])

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text || isReplying) return

    const userMsg: LabChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
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
          // Include the new user message so the LLM has the full conversation
          history: [...toApiHistory(messages), { role: "user", content: text }],
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[min(560px,85vh)] flex-col gap-0 p-0 sm:max-w-md",
          className,
        )}
        showCloseButton
      >
        <DialogHeader className="border-b border-[#E8E6E0] px-5 py-4 text-left">
          <DialogTitle className="text-[15px] text-[#102F27]">
            Lab report assistant
          </DialogTitle>
          <DialogDescription className="text-[11px]">
            {analysis
              ? "Powered by Groq Qwen — responds in English (or Arabic if you ask in Arabic)."
              : "Analyze a lab document first for report-specific answers."}
          </DialogDescription>
        </DialogHeader>

        <div
          ref={listRef}
          className="scrollbar-hide min-h-[220px] flex-1 space-y-3 overflow-y-auto px-5 py-4"
          dir="auto"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[92%] rounded-xl px-3 py-2 text-[12px] leading-relaxed",
                m.role === "user"
                  ? "ml-auto bg-[#1A5345] text-white"
                  : "mr-auto border border-[#E5EEEA] bg-[#FAFAF8] text-[#102F27]",
              )}
              dir="auto"
            >
              {m.content}
            </div>
          ))}

          {isReplying ? (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <Loader2Icon className="size-3.5 animate-spin" />
              Thinking…
            </div>
          ) : null}

          {replyError ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-[10px] text-red-700">
              <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" />
              <span>{replyError}</span>
            </div>
          ) : null}
        </div>

        <form
          id={formId}
          onSubmit={(e) => { void handleSend(e) }}
          className="flex gap-2 border-t border-[#E8E6E0] p-4"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about the report results…"
            dir="auto"
            className="focus-visible:ring-ring flex-1 rounded-lg border border-[#E5EEEA] bg-white px-3 py-2 text-[12px] outline-none focus-visible:ring-2"
            aria-label="Message to lab assistant"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!draft.trim() || isReplying}
            className="shrink-0 gap-1 bg-[#1A5345] hover:bg-[#0F3D32]"
          >
            <SendHorizontalIcon className="size-3.5" />
            Send
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
