import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { io, type Socket } from "socket.io-client"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { getAccessToken, getAuthUser } from "@/lib/auth-tokens"
import {
  applyCallPreview,
  callPreviewLabel,
  isCallActivityLabel,
  ringingCallLabel,
  type CallKind,
  type CallPreviewEntry,
  type CallPreviewState,
} from "./chat-call"
import { sortChatContactsByLastActivity } from "./chat-contact-sort"
import { startCallRing, stopCallRing } from "./chat-call-ring"
import {
  loadCallEventsState,
  loadCallPreviewState,
  saveCallEventsState,
  saveCallPreviewState,
  type PersistedCallEvent,
} from "./chat-call-storage"
import type {
  ChatContact,
  ChatMessage,
  ConversationApiRow,
  MessageApiRow,
  SendChatMessageInput,
} from "./chat.types"
import { resolveChatAvatarUrl } from "./chat-avatar"
import { deleteChatMessage } from "./chat-api"
import { formatChatLastMessagePreview } from "./chat-message-preview"
import { useChatAttachmentUpload } from "./use-chat-attachment-upload"

const CONVERSATIONS_QUERY_KEY = ["chat", "conversations"] as const
const SELF_AVATAR_QUERY_KEY = ["auth", "me", "avatar"] as const
const RING_DURATION_MS = 5_000

type IncomingCallSocketPayload = {
  conversationId: number
  kind: CallKind
  callerUserId: number
  callerName: string
  sentAt: string
}

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
    avatar: resolveChatAvatarUrl(row.participant.avatarUrl),
    lastMessage: formatChatLastMessagePreview(
      row.lastMessage?.text ?? "Start chatting",
    ),
    lastMessageAt: row.lastMessage?.sentAt ?? row.createdAt,
    time: formatTime(lastTime),
    unread: row.unreadCount,
    online: true,
    email: row.participant.email ?? null,
    specialty: row.participant.specialty ?? null,
    clinicLocation: row.participant.clinicLocation ?? null,
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
    attachments: row.attachments,
  }
}

function callEventToMessage(event: PersistedCallEvent, currentUserRole?: string): ChatMessage {
  return {
    id: event.id,
    contactId: event.conversationId,
    text: callPreviewLabel(event.kind, event.direction, "ended"),
    time: formatTime(event.sentAt),
    isSender: event.direction === "outgoing",
    status: "read",
  }
}

function mergeMessagesWithCallEvents(
  apiRows: MessageApiRow[],
  events: PersistedCallEvent[],
  currentUserRole?: string,
): ChatMessage[] {
  const apiMessages = apiRows.map((row) => toChatMessage(row, currentUserRole))
  const eventMessages = events.map((event) => callEventToMessage(event, currentUserRole))
  const seen = new Set(apiMessages.map((message) => message.id))
  const merged = [
    ...apiMessages,
    ...eventMessages.filter((message) => !seen.has(message.id)),
  ]
  merged.sort((a, b) => {
    const aEvent = events.find((event) => event.id === a.id)
    const bEvent = events.find((event) => event.id === b.id)
    const aApi = apiRows.find((row) => String(row.id) === a.id)
    const bApi = apiRows.find((row) => String(row.id) === b.id)
    const aTime = new Date(aEvent?.sentAt ?? aApi?.sentAt ?? 0).getTime()
    const bTime = new Date(bEvent?.sentAt ?? bApi?.sentAt ?? 0).getTime()
    return aTime - bTime
  })
  return merged
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

function normalizeSocketMessage(raw: IncomingSocketMessage): MessageApiRow {
  const { recipientUserIds: _r, ...msg } = raw
  return {
    ...msg,
    attachments: msg.attachments ?? [],
  }
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
      text: formatChatLastMessagePreview(msg.message, msg.attachments),
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
  const [typingConversationIds, setTypingConversationIds] = useState<Set<string>>(
    () => new Set(),
  )
  const typingClearTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  )
  const callRingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const handledMissedCallIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    activeContactIdRef.current = activeContactId
  }, [activeContactId])

  const conversationsQuery = useQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: fetchConversations,
    staleTime: 30_000,
  })

  const selfAvatarQuery = useQuery({
    queryKey: SELF_AVATAR_QUERY_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<{ avatarUrl?: string | null }>("/auth/me")
      return resolveChatAvatarUrl(data.avatarUrl)
    },
    enabled: Boolean(currentUser?.id),
    staleTime: 5 * 60 * 1000,
  })

  const { uploadAttachment, isUploading: isUploadingAttachment } =
    useChatAttachmentUpload(activeContactId)

  const [callPreviewByContactId, setCallPreviewByContactId] = useState<CallPreviewState>(
    () => loadCallPreviewState(),
  )
  const [callEventsByContactId, setCallEventsByContactId] = useState<
    Record<string, PersistedCallEvent[]>
  >(() => loadCallEventsState())

  const persistCallPreview = useCallback((conversationId: string, entry: CallPreviewEntry) => {
    setCallPreviewByContactId((prev) => {
      const next = { ...prev, [conversationId]: entry }
      saveCallPreviewState(next)
      return next
    })
  }, [])

  const clearCallPreview = useCallback((conversationId: string) => {
    setCallPreviewByContactId((prev) => {
      if (!prev[conversationId]) return prev
      const next = { ...prev }
      delete next[conversationId]
      saveCallPreviewState(next)
      return next
    })
  }, [])

  const contacts = useMemo(
    () => {
      const mapped = (conversationsQuery.data ?? []).map((row) => {
        const contact = {
          ...toChatContact(row),
          isTyping: typingConversationIds.has(String(row.id)),
        }
        return applyCallPreview(contact, callPreviewByContactId)
      })
      return sortChatContactsByLastActivity(mapped)
    },
    [conversationsQuery.data, typingConversationIds, callPreviewByContactId],
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
  const messages = useMemo(() => {
    const events = callEventsByContactId[activeContactId] ?? []
    return mergeMessagesWithCallEvents(
      messagesQuery.data ?? [],
      events,
      currentUser?.role,
    )
  }, [activeContactId, callEventsByContactId, messagesQuery.data, currentUser?.role])

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

    const clearTypingForConversation = (conversationId: string) => {
      setTypingConversationIds((prev) => {
        if (!prev.has(conversationId)) return prev
        const next = new Set(prev)
        next.delete(conversationId)
        return next
      })
      const timer = typingClearTimersRef.current.get(conversationId)
      if (timer) {
        clearTimeout(timer)
        typingClearTimersRef.current.delete(conversationId)
      }
    }

    const onTyping = (payload: {
      conversationId: number
      isTyping: boolean
      userId: number
    }) => {
      if (payload.userId === currentUser?.id) return

      const conversationId = String(payload.conversationId)

      if (payload.isTyping) {
        setTypingConversationIds((prev) => {
          const next = new Set(prev)
          next.add(conversationId)
          return next
        })

        const existing = typingClearTimersRef.current.get(conversationId)
        if (existing) clearTimeout(existing)

        typingClearTimersRef.current.set(
          conversationId,
          setTimeout(() => clearTypingForConversation(conversationId), 3000),
        )
        return
      }

      clearTypingForConversation(conversationId)
    }

    socket.on("chat:typing", onTyping)
    return () => {
      socket.off("chat:typing", onTyping)
    }
  }, [socket, currentUser?.id])

  useEffect(() => {
    if (!socket) return

    const onNewMessage = (raw: IncomingSocketMessage) => {
      const incoming = normalizeSocketMessage(raw)
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
      if (!isCallActivityLabel(incoming.message)) {
        clearCallPreview(incomingConversationId)
      }

      if (fromOther) {
        setTypingConversationIds((prev) => {
          if (!prev.has(incomingConversationId)) return prev
          const next = new Set(prev)
          next.delete(incomingConversationId)
          return next
        })
        const timer = typingClearTimersRef.current.get(incomingConversationId)
        if (timer) {
          clearTimeout(timer)
          typingClearTimersRef.current.delete(incomingConversationId)
        }
      }

      void (async () => {
        if (isViewingThisChat) {
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
  }, [socket, queryClient, currentUser?.role, clearCallPreview])

  useEffect(() => {
    if (!socket) return

    const onMessageDeleted = (payload: { conversationId: number; messageId: number }) => {
      const conversationId = String(payload.conversationId)
      queryClient.setQueryData<MessageApiRow[]>(
        ["chat", "messages", conversationId],
        (prev = []) => prev.filter((row) => row.id !== payload.messageId),
      )
      void queryClient.refetchQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
    }

    socket.on("chat:messageDeleted", onMessageDeleted)
    return () => {
      socket.off("chat:messageDeleted", onMessageDeleted)
    }
  }, [socket, queryClient])

  const persistCallEvent = useCallback((event: PersistedCallEvent) => {
    setCallEventsByContactId((prev) => {
      const existing = prev[event.conversationId] ?? []
      if (existing.some((item) => item.id === event.id)) return prev
      const next = {
        ...prev,
        [event.conversationId]: [...existing, event],
      }
      saveCallEventsState(next)
      return next
    })
  }, [])

  const clearCallRingTimer = useCallback((conversationId: string) => {
    const timer = callRingTimersRef.current.get(conversationId)
    if (timer) {
      clearTimeout(timer)
      callRingTimersRef.current.delete(conversationId)
    }
  }, [])

  const bumpConversationForCall = useCallback(
    (conversationId: string, label: string, sentAt: string, incrementUnread: boolean) => {
      const senderType =
        currentUser?.role === "doctor" ||
        currentUser?.role === "patient" ||
        currentUser?.role === "assistant"
          ? currentUser.role
          : "doctor"
      const syntheticMessage: MessageApiRow = {
        id: -Date.now(),
        conversationId: Number(conversationId),
        senderId: currentUser?.id ?? 0,
        senderType,
        message: label,
        isRead: !incrementUnread,
        sentAt,
      }

      queryClient.setQueryData<ConversationApiRow[]>(CONVERSATIONS_QUERY_KEY, (prev) => {
        const bumped = bumpConversationLastMessage(prev, conversationId, syntheticMessage, {
          clearUnread: !incrementUnread,
        })
        if (!bumped || !incrementUnread) return bumped
        return bumped.map((row) =>
          String(row.id) === conversationId
            ? { ...row, unreadCount: row.unreadCount + 1 }
            : row,
        )
      })
    },
    [currentUser?.id, currentUser?.role, queryClient],
  )

  const finalizeOutgoingMissed = useCallback(
    (conversationId: string, kind: CallKind, sentAt: string) => {
      const timeLabel = formatTime(sentAt)
      persistCallPreview(conversationId, {
        kind,
        time: timeLabel,
        direction: "outgoing",
        phase: "ended",
        sentAt,
      })
      persistCallEvent({
        id: `call-out-${conversationId}-${sentAt}`,
        conversationId,
        kind,
        direction: "outgoing",
        sentAt,
      })
      bumpConversationForCall(conversationId, callPreviewLabel(kind, "outgoing", "ended"), sentAt, false)
    },
    [bumpConversationForCall, persistCallEvent, persistCallPreview],
  )

  const finalizeIncomingMissed = useCallback(
    (payload: IncomingCallSocketPayload) => {
      const conversationId = String(payload.conversationId)
      if (handledMissedCallIdsRef.current.has(conversationId)) return
      handledMissedCallIdsRef.current.add(conversationId)
      window.setTimeout(() => {
        handledMissedCallIdsRef.current.delete(conversationId)
      }, RING_DURATION_MS + 2000)

      clearCallRingTimer(conversationId)
      stopCallRing()
      toast.dismiss(`incoming-call-${conversationId}`)

      const sentAt = payload.sentAt || new Date().toISOString()
      const timeLabel = formatTime(sentAt)

      persistCallPreview(conversationId, {
        kind: payload.kind,
        time: timeLabel,
        direction: "incoming",
        phase: "ended",
        sentAt,
      })
      persistCallEvent({
        id: `call-in-${conversationId}-${sentAt}`,
        conversationId,
        kind: payload.kind,
        direction: "incoming",
        sentAt,
      })
      bumpConversationForCall(
        conversationId,
        callPreviewLabel(payload.kind, "incoming", "ended"),
        sentAt,
        activeContactIdRef.current !== conversationId,
      )

      toast.error(
        payload.kind === "video" ? "Missed video call" : "Missed call",
        {
          description: `${payload.callerName} tried to reach you.`,
          duration: 6000,
        },
      )
    },
    [bumpConversationForCall, clearCallRingTimer, persistCallEvent, persistCallPreview],
  )

  const scheduleIncomingMissed = useCallback(
    (conversationId: string, payload: IncomingCallSocketPayload) => {
      clearCallRingTimer(conversationId)
      const timer = setTimeout(() => {
        finalizeIncomingMissed(payload)
      }, RING_DURATION_MS)
      callRingTimersRef.current.set(conversationId, timer)
    },
    [clearCallRingTimer, finalizeIncomingMissed],
  )

  useEffect(() => {
    if (!socket) return

    const onIncomingCall = (payload: IncomingCallSocketPayload) => {
      const conversationId = String(payload.conversationId)
      const timeLabel = formatTime(payload.sentAt)

      persistCallPreview(conversationId, {
        kind: payload.kind,
        time: timeLabel,
        direction: "incoming",
        phase: "ringing",
        sentAt: payload.sentAt,
      })

      bumpConversationForCall(
        conversationId,
        ringingCallLabel(payload.kind, "incoming"),
        payload.sentAt,
        true,
      )

      startCallRing()

      toast(
        payload.kind === "video"
          ? `${payload.callerName} — video call`
          : `${payload.callerName} — voice call`,
        {
          id: `incoming-call-${conversationId}`,
          description: "Incoming call — answer when live calls are enabled.",
          duration: RING_DURATION_MS,
        },
      )

      scheduleIncomingMissed(conversationId, payload)
    }

    const onCallMissed = (payload: IncomingCallSocketPayload) => {
      if (payload.callerUserId === currentUser?.id) return
      finalizeIncomingMissed(payload)
    }

    socket.on("chat:incomingCall", onIncomingCall)
    socket.on("chat:callMissed", onCallMissed)

    return () => {
      socket.off("chat:incomingCall", onIncomingCall)
      socket.off("chat:callMissed", onCallMissed)
    }
  }, [
    socket,
    currentUser?.id,
    bumpConversationForCall,
    finalizeIncomingMissed,
    persistCallPreview,
    scheduleIncomingMissed,
  ])

  useEffect(() => {
    return () => {
      stopCallRing()
      for (const timer of callRingTimersRef.current.values()) {
        clearTimeout(timer)
      }
      callRingTimersRef.current.clear()
    }
  }, [])

  const sendMutation = useMutation({
    mutationFn: async (input: SendChatMessageInput) => {
      const value = input.text?.trim() ?? ""
      const attachments = input.attachments ?? []
      if ((!value && attachments.length === 0) || !activeContactId) return

      const payload = {
        conversationId: Number(activeContactId),
        message: value || undefined,
        attachments: attachments.length ? attachments : undefined,
      }

      if (socket) {
        await new Promise<void>((resolve, reject) => {
          socket.emit(
            "chat:sendMessage",
            payload,
            (ack: { ok?: boolean; message?: IncomingSocketMessage }) => {
              if (ack?.ok) {
                const created = ack.message ? normalizeSocketMessage(ack.message) : undefined
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
                  clearCallPreview(cid)
                }
                void queryClient
                  .refetchQueries({ queryKey: ["chat", "messages", activeContactId] })
                  .finally(() =>
                    queryClient
                      .refetchQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
                      .finally(() => resolve()),
                  )
                return
              }
              reject(new Error("Could not send message"))
            },
          )
        })
        return
      }

      await apiClient.post(`/chat/conversations/${activeContactId}/messages`, {
        message: value || undefined,
        attachments: attachments.length ? attachments : undefined,
      })
      clearCallPreview(activeContactId)
      await queryClient.refetchQueries({ queryKey: ["chat", "messages", activeContactId] })
      await queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
    },
  })

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!activeContactId) return
      const numericId = Number(messageId)
      if (!Number.isFinite(numericId) || numericId <= 0) return

      if (socket) {
        await new Promise<void>((resolve, reject) => {
          socket.emit(
            "chat:deleteMessage",
            { conversationId: Number(activeContactId), messageId: numericId },
            (ack: { ok?: boolean }) => {
              if (ack?.ok) {
                queryClient.setQueryData<MessageApiRow[]>(
                  ["chat", "messages", activeContactId],
                  (prev = []) => prev.filter((row) => row.id !== numericId),
                )
                void queryClient
                  .refetchQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
                  .finally(() => resolve())
                return
              }
              reject(new Error("Could not delete message"))
            },
          )
        })
        return
      }

      await deleteChatMessage(activeContactId, numericId)
      queryClient.setQueryData<MessageApiRow[]>(
        ["chat", "messages", activeContactId],
        (prev = []) => prev.filter((row) => row.id !== numericId),
      )
      await queryClient.refetchQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
    },
  })

  const notifyTyping = useCallback(
    (isTyping: boolean) => {
      if (!socket || !activeContactId) return
      socket.emit("chat:typing", {
        conversationId: Number(activeContactId),
        isTyping,
      })
    },
    [socket, activeContactId],
  )

  const initiateCall = useCallback(
    (conversationId: string, kind: CallKind) => {
      if (!conversationId) return

      const sentAt = new Date().toISOString()
      const timeLabel = formatTime(sentAt)

      persistCallPreview(conversationId, {
        kind,
        time: timeLabel,
        direction: "outgoing",
        phase: "ringing",
        sentAt,
      })

      bumpConversationForCall(conversationId, ringingCallLabel(kind, "outgoing"), sentAt, false)

      startCallRing()

      if (socket) {
        socket.emit(
          "chat:ringCall",
          { conversationId: Number(conversationId), kind },
          (ack: { ok?: boolean }) => {
            if (!ack?.ok) {
              stopCallRing()
              clearCallRingTimer(conversationId)
              toast.error("Could not start call", {
                description: "Check your connection and try again.",
              })
            }
          },
        )
      } else {
        toast.error("Not connected", { description: "Chat socket is offline." })
        stopCallRing()
        return
      }

      clearCallRingTimer(conversationId)
      const timer = setTimeout(() => {
        stopCallRing()
        const missedAt = new Date().toISOString()
        finalizeOutgoingMissed(conversationId, kind, missedAt)
        socket.emit("chat:callMissed", { conversationId: Number(conversationId), kind })
      }, RING_DURATION_MS)
      callRingTimersRef.current.set(conversationId, timer)
    },
    [
      bumpConversationForCall,
      clearCallRingTimer,
      finalizeOutgoingMissed,
      persistCallEvent,
      persistCallPreview,
      socket,
    ],
  )

  return {
    contacts,
    activeContact,
    activeContactId,
    setActiveContactId: selectContact,
    messages,
    sendMessage: (input: SendChatMessageInput | string) =>
      sendMutation.mutateAsync(
        typeof input === "string" ? { text: input } : input,
      ),
    uploadChatAttachment: uploadAttachment,
    isUploadingAttachment,
    deleteMessage: (messageId: string) => deleteMessageMutation.mutateAsync(messageId),
    isDeletingMessage: deleteMessageMutation.isPending,
    notifyTyping,
    recordMissedCall: initiateCall,
    initiateCall,
    callPreviewByContactId,
    currentUserAvatar: selfAvatarQuery.data ?? "",
    startNewChat: (conversationId: string) => {
      selectContact(conversationId)
    },
    isLoadingConversations: conversationsQuery.isLoading,
    isLoadingMessages: messagesQuery.isLoading,
  }
}
