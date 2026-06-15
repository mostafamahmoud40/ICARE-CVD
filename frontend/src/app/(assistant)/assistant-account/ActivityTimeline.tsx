"use client"

import type { ComponentType } from "react"
import {
  CalendarClockIcon,
  ClipboardListIcon,
  FileTextIcon,
  UsersIcon,
} from "lucide-react"
import type { ActivityEntry } from "./assistantAccount.types"

function formatTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatDateTimeShort(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

export function activityTypeIcon(type: ActivityEntry["type"]): ComponentType<{ className?: string }> {
  switch (type) {
    case "patient":
      return UsersIcon
    case "appointment":
      return CalendarClockIcon
    case "queue":
      return ClipboardListIcon
    case "document":
      return FileTextIcon
  }
}

export function ActivityTimeline({
  entries,
  emptyMessage = "No activity found.",
  onSelect,
}: {
  entries: ActivityEntry[]
  emptyMessage?: string
  onSelect?: (entry: ActivityEntry) => void
}) {
  if (entries.length === 0) {
    return <p className="py-8 text-center text-[13px] font-medium text-[#6B7870] sm:text-[14px]">{emptyMessage}</p>
  }

  return (
    <ol className="relative min-h-0 space-y-0">
      {entries.map((entry, index) => {
        const Icon = activityTypeIcon(entry.type)
        const isLast = index === entries.length - 1
        const content = (
          <>
            <Icon className="relative z-10 mt-0.5 size-5 shrink-0 text-[#1A5345] sm:size-[18px]" aria-hidden />

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-[14px] font-bold text-[#1A1F1E] sm:text-[15px]">{entry.action}</p>
                <time
                  dateTime={entry.timestamp}
                  className="shrink-0 text-[11px] font-medium tabular-nums text-[#6B7870] sm:text-[12px]"
                >
                  {formatTimeAgo(entry.timestamp)}
                </time>
              </div>
              <p className="mt-1 text-[13px] font-medium leading-relaxed text-[#6B7870] sm:text-[14px]">
                {entry.description}
              </p>
              <p className="mt-1.5 text-[11px] font-medium tabular-nums text-[#6B7870]/75 sm:text-[12px]">
                {formatDateTimeShort(entry.timestamp)}
              </p>
            </div>
          </>
        )

        return (
          <li key={entry.id} className="relative pb-7 last:pb-0">
            {!isLast ? (
              <span className="absolute bottom-0 left-[9px] top-7 w-px bg-[#E8E6E0] sm:left-[9px]" aria-hidden />
            ) : null}

            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(entry)}
                className="relative flex w-full gap-4 rounded-xl border border-transparent p-2 text-left transition-all hover:border-[#E8E6E0]/80 hover:bg-[#F9F8F5]/80 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5345]/25"
              >
                {content}
              </button>
            ) : (
              <div className="relative flex gap-4 p-2">{content}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
