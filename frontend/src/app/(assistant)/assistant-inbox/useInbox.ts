"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { mockInboxData, mockInboxMessages } from "./inbox.mock"
import type { InboxData, InboxMessage, InboxFilters, MessageStatus } from "./inbox.types"

const QUERY_KEY = "assistant-inbox"

export function useInbox(filters: InboxFilters = {}) {
  return useQuery<InboxData, Error>({
    queryKey: [QUERY_KEY, filters],
    queryFn: async () => {
      let filteredMessages = mockInboxMessages

      if (filters.status) {
        filteredMessages = filteredMessages.filter((m) => m.status === filters.status)
      }
      if (filters.type) {
        filteredMessages = filteredMessages.filter((m) => m.type === filters.type)
      }
      if (filters.priority) {
        filteredMessages = filteredMessages.filter((m) => m.priority === filters.priority)
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        filteredMessages = filteredMessages.filter(
          (m) =>
            m.subject.toLowerCase().includes(query) ||
            m.preview.toLowerCase().includes(query) ||
            m.sender.name.toLowerCase().includes(query)
        )
      }

      return {
        messages: filteredMessages,
        stats: {
          total: mockInboxMessages.length,
          unread: mockInboxMessages.filter((m) => m.status === "unread").length,
          read: mockInboxMessages.filter((m) => m.status === "read").length,
          archived: mockInboxMessages.filter((m) => m.status === "archived").length,
        },
        filters,
      }
    },
    staleTime: 30 * 1000,
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation<InboxMessage, Error, string>({
    mutationFn: async (messageId: string) => {
      const message = mockInboxMessages.find((m) => m.id === messageId)
      if (!message) throw new Error("Message not found")
      
      message.status = "read"
      message.readAt = new Date().toISOString()
      
      return message
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useMarkAsUnread() {
  const queryClient = useQueryClient()

  return useMutation<InboxMessage, Error, string>({
    mutationFn: async (messageId: string) => {
      const message = mockInboxMessages.find((m) => m.id === messageId)
      if (!message) throw new Error("Message not found")
      
      message.status = "unread"
      message.readAt = undefined
      
      return message
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useArchiveMessage() {
  const queryClient = useQueryClient()

  return useMutation<InboxMessage, Error, string>({
    mutationFn: async (messageId: string) => {
      const message = mockInboxMessages.find((m) => m.id === messageId)
      if (!message) throw new Error("Message not found")
      
      message.status = "archived"
      message.archivedAt = new Date().toISOString()
      
      return message
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useUnarchiveMessage() {
  const queryClient = useQueryClient()

  return useMutation<InboxMessage, Error, string>({
    mutationFn: async (messageId: string) => {
      const message = mockInboxMessages.find((m) => m.id === messageId)
      if (!message) throw new Error("Message not found")
      
      message.status = "read"
      message.archivedAt = undefined
      
      return message
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}
