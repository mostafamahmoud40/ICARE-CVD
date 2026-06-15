"use client"

import type { ComponentType } from "react"
import { ClockIcon, HashIcon, TagIcon, XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import { activityTypeIcon } from "./ActivityTimeline"
import type { ActivityEntry } from "./assistantAccount.types"

const ACTIVITY_TYPE_META: Record<
  ActivityEntry["type"],
  { label: string; badgeClass: string; iconClass: string }
> = {
  patient: {
    label: "Patient",
    badgeClass: "border-0 bg-[#1A5345] text-white hover:bg-[#1A5345]",
    iconClass: "text-[#1A5345]",
  },
  appointment: {
    label: "Appointment",
    badgeClass: "border-0 bg-[#2563EB] text-white hover:bg-[#2563EB]",
    iconClass: "text-[#2563EB]",
  },
  queue: {
    label: "Queue",
    badgeClass: "border-0 bg-amber-500 text-white hover:bg-amber-500",
    iconClass: "text-amber-600",
  },
  document: {
    label: "Document",
    badgeClass: "border-0 bg-violet-600 text-white hover:bg-violet-600",
    iconClass: "text-violet-700",
  },
}

function formatTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatDateTimeLong(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

function formatDateTimeShort(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

function DetailCell({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[#E8E6E0]/60 bg-[#F9F8F5]/40 px-2.5 py-2 sm:px-3 sm:py-2.5",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 shrink-0 text-[#1A5345]" aria-hidden />
        <p className="text-[10px] font-bold uppercase tracking-tight text-[#6B7870]">{label}</p>
      </div>
      <p className="mt-1 text-[12px] font-semibold leading-snug text-[#1A1F1E]">{value}</p>
    </div>
  )
}

type ActivityDetailDialogProps = {
  entry: ActivityEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ActivityDetailDialog({ entry, open, onOpenChange }: ActivityDetailDialogProps) {
  if (!entry) return null

  const meta = ACTIVITY_TYPE_META[entry.type]
  const Icon = activityTypeIcon(entry.type)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white p-0 shadow-2xl sm:max-w-[520px]"
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-lg border border-[#E8E6E0]/60 bg-white/90 text-muted-foreground shadow-sm transition-colors hover:bg-[#F9F8F5] hover:text-[#1A5345] sm:right-4 sm:top-4"
          aria-label="Close"
        >
          <XIcon className="size-3.5" />
        </button>

        <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-5 py-4 sm:px-6">
          <DialogHeader className="gap-0 space-y-0 text-left">
            <div className="flex items-start gap-3.5 pr-8">
              <Icon className={cn("mt-0.5 size-6 shrink-0 sm:size-7", meta.iconClass)} aria-hidden />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="font-serif text-[20px] font-bold leading-tight text-[#1A1F1E] sm:text-[22px]">
                    {entry.action}
                  </DialogTitle>
                  <Badge
                    variant="default"
                    className={cn("gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold", meta.badgeClass)}
                  >
                    {meta.label}
                  </Badge>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-3 px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            <DetailCell icon={TagIcon} label="Category" value={meta.label} />
            <DetailCell icon={ClockIcon} label="Time ago" value={formatTimeAgo(entry.timestamp)} />
            <DetailCell icon={ClockIcon} label="Date & time" value={formatDateTimeShort(entry.timestamp)} />
            <DetailCell icon={HashIcon} label="Reference" value={entry.id.toUpperCase()} />
          </div>

          <div className="rounded-xl border border-[#E8E6E0]/70 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7870]">Details</p>
            <p className="mt-3 font-serif text-[17px] font-bold leading-relaxed text-[#1A1F1E] sm:text-[18px]">
              {entry.description}
            </p>
            <p className="mt-3 text-[12px] font-medium text-muted-foreground sm:text-[13px]">
              {formatDateTimeLong(entry.timestamp)}
            </p>
          </div>
        </div>

        <div className="border-t border-[#E8E6E0]/60 bg-[#F9F8F5]/40 px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 w-full rounded-xl border-[#E8E6E0] bg-white text-[13px] font-bold text-[#1A5345] shadow-sm hover:bg-white hover:text-[#133F34]"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
