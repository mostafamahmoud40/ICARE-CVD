"use client"

import { useCallback, useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type {
  DoctorAiChatApiResponse,
  DoctorChatDisplayMessage,
  DoctorChatHistoryItem,
  DoctorChatMessage,
} from "./doctor-ai-chat.types"

let idCounter = 0
function newId(prefix: string) {
  return `${prefix}-${++idCounter}-${Date.now()}`
}

function fmt(date: Date) {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
}

function toDisplay(msg: DoctorChatMessage): DoctorChatDisplayMessage {
  return { ...msg, time: fmt(msg.sentAt) }
}

export function useDoctorAiChat() {
  const messagesRef = useRef<DoctorChatDisplayMessage[]>([])
  const [messages, setMessages] = useState<DoctorChatDisplayMessage[]>([])
  const queryClient = useQueryClient()

  function setAll(msgs: DoctorChatDisplayMessage[]) {
    messagesRef.current = msgs
    setMessages(msgs)
  }

  function append(newMsgs: DoctorChatMessage[]) {
    setAll([...messagesRef.current, ...newMsgs.map(toDisplay)])
  }

  const sendMutation = useMutation({
    mutationFn: async ({
      text,
      focusPatientId,
    }: {
      text: string
      focusPatientId?: string
    }): Promise<DoctorAiChatApiResponse | null> => {
      if (!text.trim()) return null

      const history: DoctorChatHistoryItem[] = messagesRef.current
        .slice(0, -1)
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.text }))

      const { data } = await apiClient.post<DoctorAiChatApiResponse>(
        "/ai/doctor/chat",
        { message: text, history, focusPatientId },
      )
      return data
    },

    onMutate: async ({ text }) => {
      const trimmed = text.trim()
      if (!trimmed) return
      const userMsg: DoctorChatMessage = {
        id: newId("u"),
        role: "user",
        text: trimmed,
        sentAt: new Date(),
      }
      const typingMsg: DoctorChatMessage = {
        id: newId("typing"),
        role: "assistant",
        text: "…",
        sentAt: new Date(),
      }
      append([userMsg, typingMsg])
    },

    onSuccess: (response) => {
      if (!response) return
      const assistantMsg: DoctorChatMessage = {
        id: newId("a"),
        role: "assistant",
        text: response.reply,
        sentAt: new Date(),
      }
      const withoutTyping = messagesRef.current.filter((m) => m.text !== "…")
      setAll([...withoutTyping, toDisplay(assistantMsg)])
    },

    onError: () => {
      const errMsg: DoctorChatMessage = {
        id: newId("err"),
        role: "assistant",
        text: "The assistant couldn't complete that request. Check your connection and try again.",
        sentAt: new Date(),
      }
      const withoutTyping = messagesRef.current.filter((m) => m.text !== "…")
      setAll([...withoutTyping, toDisplay(errMsg)])
    },
  })

  const sendMessage = useCallback(
    (text: string, focusPatientId?: string) => {
      const trimmed = text.trim()
      if (!trimmed || sendMutation.isPending) return
      sendMutation.mutate({ text: trimmed, focusPatientId })
    },
    [sendMutation],
  )

  const isAssistantTyping = sendMutation.isPending

  return { messages, sendMessage, isAssistantTyping, queryClient }
}
