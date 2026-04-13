import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { io, type Socket } from "socket.io-client"
import { apiClient } from "@/lib/api-client"
import { getAccessToken, getAuthUser } from "@/lib/auth-tokens"
import type { ChatContact, ChatMessage, ConversationApiRow, MessageApiRow } from "./chat.types"

const CONVERSATIONS_QUERY_KEY = ["chat", "conversations"] as const

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function socketBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_URL
  if (!raw) return undefined
  try {
    return new URL(raw).origin
  } catch {
    return raw
  }
}

function toChatContact(row: ConversationApiRow): ChatContact {
  const lastTime = row.lastMessage?.sentAt ?? row.createdAt
  return {
    id: String(row.id),
    name: row.participant.name,
    role: row.participant.role,
    avatar: "",
    lastMessage: row.lastMessage?.text ?? "Start chatting",
    time: formatTime(lastTime),
    unread: row.unreadCount,
    online: true,
  }
}

function toChatMessage(row: MessageApiRow, currentUserRole?: string): ChatMessage {
  return {
    id: String(row.id),
    contactId: String(row.conversationId),
    text: row.message,
    time: formatTime(row.sentAt),
    isSender: currentUserRole ? row.senderType === currentUserRole : false,
    status: row.isRead ? "read" : "delivered",
  }
}

async function fetchConversations() {
  const { data } = await apiClient.get<ConversationApiRow[]>("/chat/conversations")
  return data
}

async function fetchConversationMessages(conversationId: string) {
  const { data } = await apiClient.get<MessageApiRow[]>(
    `/chat/conversations/${conversationId}/messages`,
  )
  return data
}

export function useChat() {
  const queryClient = useQueryClient()
  const currentUser = getAuthUser()
  const token = getAccessToken()
  const [activeContactId, setActiveContactId] = useState<string>("")
  const [socket, setSocket] = useState<Socket | null>(null)

  const conversationsQuery = useQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: fetchConversations,
    staleTime: 30_000,
  })

  const contacts = useMemo(
    () => (conversationsQuery.data ?? []).map(toChatContact),
    [conversationsQuery.data],
  )

  useEffect(() => {
    if (!activeContactId && contacts[0]) {
      setActiveContactId(contacts[0].id)
    }
  }, [activeContactId, contacts])

  const messagesQuery = useQuery({
    queryKey: ["chat", "messages", activeContactId],
    queryFn: () => fetchConversationMessages(activeContactId),
    enabled: Boolean(activeContactId),
  })

  const activeContact = contacts.find((c) => c.id === activeContactId)
  const messages = useMemo(
    () => (messagesQuery.data ?? []).map((row) => toChatMessage(row, currentUser?.role)),
    [messagesQuery.data, currentUser?.role],
  )

  useEffect(() => {
    if (!token) return
    const created = io(`${socketBaseUrl()}/chat`, {
      auth: { token },
      transports: ["websocket"],
    })
    setSocket(created)
    return () => {
      created.disconnect()
      setSocket(null)
    }
  }, [token])

  useEffect(() => {
    if (!socket || !activeContactId) return
    socket.emit("chat:joinConversation", { conversationId: Number(activeContactId) })
  }, [socket, activeContactId])

  useEffect(() => {
    if (!socket) return

    const onNewMessage = (incoming: MessageApiRow) => {
      const incomingConversationId = String(incoming.conversationId)
      queryClient.setQueryData<MessageApiRow[]>(
        ["chat", "messages", incomingConversationId],
        (prev = []) => {
          if (prev.some((row) => row.id === incoming.id)) return prev
          return [...prev, incoming]
        },
      )
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
    }

    socket.on("chat:newMessage", onNewMessage)
    return () => {
      socket.off("chat:newMessage", onNewMessage)
    }
  }, [socket, queryClient])

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const value = text.trim()
      if (!value || !activeContactId) return

      if (socket) {
        await new Promise<void>((resolve, reject) => {
          socket.emit(
            "chat:sendMessage",
            { conversationId: Number(activeContactId), message: value },
            (ack: { ok?: boolean }) => {
              if (ack?.ok) {
                resolve()
                return
              }
              reject(new Error("Could not send message"))
            },
          )
        })
        return
      }

      await apiClient.post(`/chat/conversations/${activeContactId}/messages`, {
        message: value,
      })
      await queryClient.invalidateQueries({ queryKey: ["chat", "messages", activeContactId] })
      await queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
    },
  })

  return {
    contacts,
    activeContact,
    activeContactId,
    setActiveContactId,
    messages,
    sendMessage: (text: string) => sendMutation.mutateAsync(text),
    startNewChat: (conversationId: string) => {
      setActiveContactId(conversationId)
    },
    isLoadingConversations: conversationsQuery.isLoading,
    isLoadingMessages: messagesQuery.isLoading,
  }
}
