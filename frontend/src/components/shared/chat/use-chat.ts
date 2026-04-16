import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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

/** Socket payload may include extra fields from the gateway. */
type IncomingSocketMessage = MessageApiRow & { recipientUserIds?: number[] }

function stripSocketMessage(raw: IncomingSocketMessage): MessageApiRow {
  const { recipientUserIds: _r, ...msg } = raw
  return msg
}

function bumpConversationLastMessage(
  prev: ConversationApiRow[] | undefined,
  conversationId: string,
  msg: MessageApiRow,
  options?: { clearUnread?: boolean },
): ConversationApiRow[] | undefined {
  if (!prev) return prev
  const idx = prev.findIndex((r) => String(r.id) === conversationId)
  if (idx === -1) return prev
  const row = prev[idx]
  const updated: ConversationApiRow = {
    ...row,
    lastMessage: {
      text: msg.message,
      senderType: msg.senderType,
      sentAt: msg.sentAt,
      isRead: msg.isRead,
    },
    ...(options?.clearUnread ? { unreadCount: 0 } : {}),
  }
  const rest = prev.filter((_, i) => i !== idx)
  return [updated, ...rest]
}

export function useChat() {
  const queryClient = useQueryClient()
  const currentUser = getAuthUser()
  const token = getAccessToken()
  const [activeContactId, setActiveContactId] = useState<string>("")
  const activeContactIdRef = useRef(activeContactId)
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    activeContactIdRef.current = activeContactId
  }, [activeContactId])

  const conversationsQuery = useQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: fetchConversations,
    staleTime: 30_000,
  })

  const contacts = useMemo(
    () => (conversationsQuery.data ?? []).map(toChatContact),
    [conversationsQuery.data],
  )


  const messagesQuery = useQuery({
    queryKey: ["chat", "messages", activeContactId],
    queryFn: () => fetchConversationMessages(activeContactId),
    enabled: Boolean(activeContactId),
  })

  /** Opening a conversation marks messages read on the server; sync list + clear badge immediately in the UI. */
  const clearUnreadForConversation = useCallback(
    (conversationId: string) => {
      queryClient.setQueryData<ConversationApiRow[]>(CONVERSATIONS_QUERY_KEY, (prev) => {
        if (!prev) return prev
        return prev.map((row) =>
          String(row.id) === conversationId ? { ...row, unreadCount: 0 } : row,
        )
      })
    },
    [queryClient],
  )

  const selectContact = useCallback(
    (id: string) => {
      clearUnreadForConversation(id)
      setActiveContactId(id)
    },
    [clearUnreadForConversation],
  )

  useEffect(() => {
    if (!activeContactId) return
    if (messagesQuery.isSuccess) {
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
    }
  }, [activeContactId, messagesQuery.isSuccess, messagesQuery.dataUpdatedAt, queryClient])

  useEffect(() => {
    if (!activeContactId || !messagesQuery.isError) return
    void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
  }, [activeContactId, messagesQuery.isError, queryClient])

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

    const onNewMessage = (raw: IncomingSocketMessage) => {
      const incoming = stripSocketMessage(raw)
      const incomingConversationId = String(incoming.conversationId)
      const isViewingThisChat = incomingConversationId === activeContactIdRef.current
      const fromOther = Boolean(
        currentUser?.role && incoming.senderType !== currentUser.role,
      )

      queryClient.setQueryData<MessageApiRow[]>(
        ["chat", "messages", incomingConversationId],
        (prev = []) => {
          if (prev.some((row) => row.id === incoming.id)) return prev
          return [...prev, incoming]
        },
      )
      queryClient.setQueryData<ConversationApiRow[]>(CONVERSATIONS_QUERY_KEY, (prev) =>
        bumpConversationLastMessage(prev, incomingConversationId, incoming, {
          clearUnread: isViewingThisChat,
        }),
      )

      void (async () => {
        if (isViewingThisChat && fromOther) {
          await queryClient.refetchQueries({
            queryKey: ["chat", "messages", incomingConversationId],
          })
        }
        await queryClient.refetchQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
      })()
    }

    socket.on("chat:newMessage", onNewMessage)
    return () => {
      socket.off("chat:newMessage", onNewMessage)
    }
  }, [socket, queryClient, currentUser?.role])

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const value = text.trim()
      if (!value || !activeContactId) return

      if (socket) {
        await new Promise<void>((resolve, reject) => {
          socket.emit(
            "chat:sendMessage",
            { conversationId: Number(activeContactId), message: value },
            (ack: { ok?: boolean; message?: IncomingSocketMessage }) => {
              if (ack?.ok) {
                const created = ack.message ? stripSocketMessage(ack.message) : undefined
                if (created) {
                  const cid = String(created.conversationId)
                  queryClient.setQueryData<MessageApiRow[]>(
                    ["chat", "messages", cid],
                    (prev = []) => {
                      if (prev.some((row) => row.id === created.id)) return prev
                      return [...prev, created]
                    },
                  )
                  queryClient.setQueryData<ConversationApiRow[]>(CONVERSATIONS_QUERY_KEY, (prev) =>
                    bumpConversationLastMessage(prev, cid, created, { clearUnread: true }),
                  )
                }
                void queryClient
                  .refetchQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
                  .finally(() => resolve())
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
    setActiveContactId: selectContact,
    messages,
    sendMessage: (text: string) => sendMutation.mutateAsync(text),
    startNewChat: (conversationId: string) => {
      selectContact(conversationId)
    },
    isLoadingConversations: conversationsQuery.isLoading,
    isLoadingMessages: messagesQuery.isLoading,
  }
}
