"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createOrGetConversation } from "./chat-api"

export function assistantDoctorChatHref(doctorId: string) {
  return `/assistant-chats?doctorId=${encodeURIComponent(doctorId)}`
}

export function assistantPatientChatHref(patientId: string) {
  return `/assistant-chats?patientId=${encodeURIComponent(patientId)}`
}

export function useChatDeepLink(startNewChat: (conversationId: string) => void) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const handledKeyRef = useRef<string | null>(null)
  const [isOpeningChat, setIsOpeningChat] = useState(false)

  useEffect(() => {
    const doctorId = searchParams.get("doctorId")?.trim()
    const patientId = searchParams.get("patientId")?.trim()
    if (!doctorId && !patientId) return

    const key = doctorId ? `doctor:${doctorId}` : `patient:${patientId}`
    if (handledKeyRef.current === key) return

    let cancelled = false
    setIsOpeningChat(true)

    void (async () => {
      try {
        const result = await createOrGetConversation(
          doctorId ? { doctorId } : { patientId: patientId! },
        )
        if (cancelled) return

        handledKeyRef.current = key
        await queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] })
        startNewChat(String(result.id))
        router.replace("/assistant-chats", { scroll: false })
      } catch {
        if (!cancelled) {
          toast.error("Could not open chat", {
            description: "Check your connection and try again from Chats.",
          })
        }
      } finally {
        if (!cancelled) setIsOpeningChat(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [searchParams, startNewChat, queryClient, router])

  return { isOpeningChat }
}
