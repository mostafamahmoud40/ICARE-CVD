import { useCallback, useState, useSyncExternalStore } from "react"
import { useMutation } from "@tanstack/react-query"
import { getMockAssistantReply } from "./mock-ai-reply"
import type { AiChatDisplayMessage, AiChatMessage } from "./ai-chat.types"

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

const initialAssistant: AiChatMessage = {
  id: "welcome",
  role: "assistant",
  greeting: "Hello Elena,",
  text: "I've reviewed your latest blood panel from yesterday. Your glucose levels are within a healthy range, but your Vitamin D remains slightly below the target threshold. Would you like to discuss dietary adjustments or schedule a follow-up with Dr. Aris?",
  actions: [
    { id: "view-lab", label: "View Lab PDF", icon: "download", href: "/patient/consultations" },
    { id: "book-followup", label: "Book Follow-up", icon: "calendar", href: "/patient/appointments" },
  ],
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
        text: reply.text,
        greeting: reply.greeting,
        actions: reply.actions,
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

  const displayMessages: AiChatDisplayMessage[] = messages.map((m) => ({
    ...m,
    time: showTimes ? formatTime(m.sentAt) : "",
  }))

  return {
    messages: displayMessages,
    activeContactId: THREAD_ID,
    sendMessage,
    isAssistantTyping: sendMutation.isPending,
  }
}
