"use client"

import * as React from "react"

import { useInbox, useMarkAsRead, useMarkAsUnread, useArchiveMessage, useUnarchiveMessage } from "./useInbox"
import { Inbox } from "./Inbox"
import type { InboxFilters } from "./inbox.types"

export function InboxPageContainer() {
  const [filters, setFilters] = React.useState<InboxFilters>({})
  const [selectedMessageId, setSelectedMessageId] = React.useState<string | null>(null)

  const { data, isLoading, isError, error } = useInbox(filters)
  const markAsRead = useMarkAsRead()
  const markAsUnread = useMarkAsUnread()
  const archive = useArchiveMessage()
  const unarchive = useUnarchiveMessage()

  const handleMarkAsRead = React.useCallback(
    (id: string) => {
      markAsRead.mutate(id, {
        onSuccess: () => {
          if (selectedMessageId === id) {
            setSelectedMessageId(null)
          }
        },
      })
    },
    [markAsRead, selectedMessageId]
  )

  const handleMarkAsUnread = React.useCallback(
    (id: string) => {
      markAsUnread.mutate(id)
    },
    [markAsUnread]
  )

  const handleArchive = React.useCallback(
    (id: string) => {
      archive.mutate(id, {
        onSuccess: () => {
          if (selectedMessageId === id) {
            setSelectedMessageId(null)
          }
        },
      })
    },
    [archive, selectedMessageId]
  )

  const handleUnarchive = React.useCallback(
    (id: string) => {
      unarchive.mutate(id)
    },
    [unarchive]
  )

  return (
    <Inbox
      data={data}
      isLoading={isLoading}
      isError={isError}
      error={error}
      filters={filters}
      onFiltersChange={setFilters}
      selectedMessageId={selectedMessageId}
      onSelectMessage={setSelectedMessageId}
      onMarkAsRead={handleMarkAsRead}
      onMarkAsUnread={handleMarkAsUnread}
      onArchive={handleArchive}
      onUnarchive={handleUnarchive}
      isMarkingAsRead={markAsRead.isPending}
      isArchiving={archive.isPending || unarchive.isPending}
    />
  )
}
