import { useCallback, useRef, useState, useSyncExternalStore } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
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

function newId(prefix: string) {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}`
}

type ApiChatResponse = {
  reply: string
  booking?: {
    confirmationCode: string
    scheduledAt: string
    doctorName: string
    visitType: string
  }
  appointmentsUpdated?: boolean
}

type HistoryItem = { role: "user" | "assistant"; content: string }

const initialAssistant: AiChatMessage = {
  id: "welcome",
  role: "assistant",
  greeting: "Hello,",
  text: "I'm your ICARE health assistant. Ask about appointments, medications, or your care plan.",
  actions: [
    { id: "book-followup", label: "Book Follow-up", icon: "calendar", href: "/doctor-directory" },
  ],
  sentAt: new Date(),
}

export function usePatientAiChat() {
  const [messages, setMessages] = useState<AiChatMessage[]>([initialAssistant])
  const showTimes = useClientTimesReady()
  const queryClient = useQueryClient()

  /** Maintained in a ref so the mutationFn always sees the latest list without stale closure. */
  const messagesRef = useRef<AiChatMessage[]>([initialAssistant])

  function appendMessages(msgs: AiChatMessage[]) {
    messagesRef.current = [...messagesRef.current, ...msgs]
    setMessages(messagesRef.current)
  }

  const sendMutation = useMutation({
    mutationFn: async (raw: string): Promise<ApiChatResponse | null> => {
      const text = raw.trim()
      if (!text) return null

      // Build history from all messages except the initial welcome and the
      // user message we just appended in onMutate (last element).
      const history: HistoryItem[] = messagesRef.current
        .slice(1, -1) // skip welcome + the just-added user message
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.text }))

      try {
        const { data } = await apiClient.post<ApiChatResponse>("/ai/chat", {
          message: text,
          history,
        })
        return data
      } catch {
        // Fallback to local mock when API is unavailable (dev / offline)
        await new Promise((r) => setTimeout(r, 450 + Math.random() * 400))
        const mock = getMockAssistantReply(text)
        return { reply: mock.text }
      }
    },

    onMutate: async (raw) => {
      const text = raw.trim()
      if (!text) return
      const userMsg: AiChatMessage = {
        id: newId("u"),
        role: "user",
        text,
        sentAt: new Date(),
      }
      appendMessages([userMsg])
    },

    onSuccess: (response) => {
      if (!response) return

      const booking = response.booking

      const assistantMsg: AiChatMessage = {
        id: newId("a"),
        role: "assistant",
        text: response.reply,
        greeting: booking ? "Appointment confirmed," : undefined,
        actions: booking
          ? [
              {
                id: "view-appointments",
                label: "View My Appointments",
                icon: "calendar",
                href: "/appointments",
              },
            ]
          : undefined,
        sentAt: new Date(),
      }

      appendMessages([assistantMsg])

      if (booking || response.appointmentsUpdated) {
        void queryClient.invalidateQueries({ queryKey: ["patient-appointments"] })
      }
    },

    onError: () => {
      const errMsg: AiChatMessage = {
        id: newId("err"),
        role: "assistant",
        text: "Something went wrong generating a reply. Please try again.",
        sentAt: new Date(),
      }
      appendMessages([errMsg])
    },
  })

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || sendMutation.isPending) return
      void sendMutation.mutateAsync(trimmed)
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
