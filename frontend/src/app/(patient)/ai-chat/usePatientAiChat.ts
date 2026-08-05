import { useCallback, useRef, useState, useSyncExternalStore } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { AgentActionRecord, AiChatDisplayMessage, AiChatMessage, PipelineStageRecord } from "./ai-chat.types"

const THREAD_ID = "icare-care-agent"

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
  agentActions?: AgentActionRecord[]
  pipelineTrace?: PipelineStageRecord[]
}

type HistoryItem = { role: "user" | "assistant"; content: string }

function buildAssistantActions(response: ApiChatResponse): AiChatMessage["actions"] {
  if (response.booking) {
    return [
      {
        id: "view-appointments",
        label: "View My Appointments",
        icon: "calendar",
        href: "/appointments",
      },
    ]
  }
  if (response.appointmentsUpdated) {
    return [
      {
        id: "view-appointments",
        label: "View updated appointments",
        icon: "calendar",
        href: "/appointments",
      },
    ]
  }
  return undefined
}

export function usePatientAiChat() {
  const [messages, setMessages] = useState<AiChatMessage[]>([])
  const showTimes = useClientTimesReady()
  const queryClient = useQueryClient()

  const messagesRef = useRef<AiChatMessage[]>([])

  function appendMessages(msgs: AiChatMessage[]) {
    messagesRef.current = [...messagesRef.current, ...msgs]
    setMessages(messagesRef.current)
  }

  const sendMutation = useMutation({
    mutationFn: async (raw: string): Promise<ApiChatResponse | null> => {
      const text = raw.trim()
      if (!text) return null

      const history: HistoryItem[] = messagesRef.current
        .slice(0, -1)
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.text }))

      const { data } = await apiClient.post<ApiChatResponse>("/ai/chat", {
        message: text,
        history,
      })
      return data
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
        greeting: booking ? "Appointment confirmed," : response.agentActions?.length ? "Done," : undefined,
        agentActions: response.agentActions,
        pipelineTrace: response.pipelineTrace,
        actions: buildAssistantActions(response),
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
        text: "The agent couldn't complete that request. Check your connection and try again.",
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
