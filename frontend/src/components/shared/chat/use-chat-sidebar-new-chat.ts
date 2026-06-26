"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { chatKeys } from "@/lib/query-keys"
import { getAuthUser } from "@/lib/auth-tokens"

import { createOrGetConversation, fetchDirectory } from "./chat-api"

export function useChatSidebarNewChat(options?: {
  directoryEnabled?: boolean
  onConversationCreated?: (conversationId: string) => void
}) {
  const queryClient = useQueryClient()
  const currentUser = getAuthUser()

  const directoryQuery = useQuery({
    queryKey: chatKeys.directory(),
    queryFn: fetchDirectory,
    enabled: options?.directoryEnabled ?? true,
    staleTime: 60_000,
  })

  const createConversationMutation = useMutation({
    mutationFn: async (entry: { profileId: string; role: string }) => {
      if (currentUser?.role === "doctor") {
        return createOrGetConversation({ patientId: entry.profileId })
      }
      if (currentUser?.role === "patient") {
        return createOrGetConversation({ doctorId: entry.profileId })
      }
      if (currentUser?.role === "assistant") {
        if (entry.role === "doctor") {
          return createOrGetConversation({ doctorId: entry.profileId })
        }
        return createOrGetConversation({ patientId: entry.profileId })
      }
      throw new Error("Unsupported role for chat")
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: chatKeys.conversations() })
      options?.onConversationCreated?.(String(data.id))
    },
  })

  return {
    directoryQuery,
    createConversationMutation,
    currentUser,
  }
}
