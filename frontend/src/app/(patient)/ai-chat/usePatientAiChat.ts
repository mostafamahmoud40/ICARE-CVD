import { useCallback, useMemo, useState, useSyncExternalStore } from "react"
import { useMutation } from "@tanstack/react-query"
import type { ChatMessage } from "@/components/shared/chat/chat.types"
import { getMockAssistantReply } from "./mock-ai-reply"
import type { AiChatMessage } from "./ai-chat.types"

const THREAD_ID = "ai-assistant"

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

/** Avoid hydration mismatch: locale time from `new Date()` differs between SSR and client. */
function useClientTimesReady() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}

function toChatMessages(rows: AiChatMessage[], showTimes: boolean): ChatMessage[] {
  return rows.map((m) => ({
    id: m.id,
    contactId: THREAD_ID,
    text: m.text,
    time: showTimes ? formatTime(m.sentAt) : "",
    isSender: m.role === "user",
    status: "read" as const,
  }))
}

const initialAssistant: AiChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Hi — I’m your ICARE assistant (demo). You can type questions about using the app or general heart-health topics. I’m not a doctor and can’t diagnose or prescribe.",
  sentAt: new Date(),
}

export function usePatientAiChat() {
  const [messages, setMessages] = useState<AiChatMessage[]>([initialAssistant])
  const showTimes = useClientTimesReady()

  const sendMutation = useMutation({
    mutationFn: async (raw: string) => {
      const text = raw.trim()
      if (!text) return null
      await new Promise((r) => setTimeout(r, 550 + Math.random() * 500))
      return getMockAssistantReply(text)
    },
    onMutate: async (raw) => {
      const text = raw.trim()
      if (!text) return
      const userMsg: AiChatMessage = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `u-${Date.now()}`,
        role: "user",
        text,
        sentAt: new Date(),
      }
      setMessages((prev) => [...prev, userMsg])
    },
    onSuccess: (reply) => {
      if (!reply) return
      const assistantMsg: AiChatMessage = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `a-${Date.now()}`,
        role: "assistant",
        text: reply,
        sentAt: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    },
  })

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || sendMutation.isPending) return
      void sendMutation.mutateAsync(text)
    },
    [sendMutation],
  )

  const chatRows = useMemo(() => toChatMessages(messages, showTimes), [messages, showTimes])

  return {
    messages: chatRows,
    activeContactId: THREAD_ID,
    sendMessage,
    isAssistantTyping: sendMutation.isPending,
  }
}
