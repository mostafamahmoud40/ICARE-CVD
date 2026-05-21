"use client"

import type { ElementType } from "react"
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CalendarClockIcon,
  ChevronRightIcon,
  FileTextIcon,
  PillIcon,
  SparklesIcon,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type AlertTone = "follow-up" | "results" | "no-show" | "rx"

type SmartAlert = {
  id: string
  title: string
  description: string
  actionLabel: string
  tone: AlertTone
}

const TONE_ICONS: Record<AlertTone, { icon: ElementType; color: string }> = {
  "follow-up": { icon: CalendarClockIcon, color: "text-amber-600" },
  results: { icon: FileTextIcon, color: "text-blue-600" },
  "no-show": { icon: AlertTriangleIcon, color: "text-red-600" },
  rx: { icon: PillIcon, color: "text-violet-600" },
}

const MOCK_ALERTS: SmartAlert[] = [
  {
    id: "1",
    title: "Noura Hamed",
    description: "Follow-up due 38 days · Dr. Sarah Khairy",
    actionLabel: "Book",
    tone: "follow-up",
  },
  {
    id: "2",
    title: "Omar Said",
    description: "Holter ready 5 days · Dr. Ahmed",
    actionLabel: "Remind",
    tone: "results",
  },
  {
    id: "3",
    title: "Karim Tarek",
    description: "No-show 3 days · not contacted",
    actionLabel: "Contact",
    tone: "no-show",
  },
  {
    id: "4",
    title: "3 patients",
    description: "Rx expiring · Ahmed (2), Youssef (1)",
    actionLabel: "View",
    tone: "rx",
  },
]

function AlertRow({ alert }: { alert: SmartAlert }) {
  const { icon: Icon, color } = TONE_ICONS[alert.tone]

  return (
    <li>
      <button
        type="button"
        className="group flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#F9F8F5]"
      >
        <Icon className={`size-4 shrink-0 ${color}`} strokeWidth={2} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium text-[#102F27]">{alert.title}</p>
          <p className="mt-0.5 truncate text-[11px] text-[#6B7870]">{alert.description}</p>
        </div>
        <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-[#1A5345] group-hover:text-[#0F3D32]">
          {alert.actionLabel}
          <ChevronRightIcon className="size-3.5 opacity-60" />
        </span>
      </button>
    </li>
  )
}

export function AiSmartAlertsPopover() {
  const count = MOCK_ALERTS.length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative flex size-10 items-center justify-center rounded-xl border border-[#E5EEEA] bg-white text-[#1A5345] transition-all hover:border-[#1A5345]/20 hover:bg-[#E8F0EE]"
          title="Smart alerts"
        >
          <SparklesIcon className="size-4" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 min-w-4 items-center justify-center rounded-full bg-[#1A5345] px-0.5 text-[9px] font-bold text-white ring-2 ring-white">
              {count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(320px,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-[#E8E6E0] bg-white p-0 shadow-md"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[#E8E6E0] px-3 py-2.5">
          <div className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-[#1A5345]" />
            <span className="text-[13px] font-semibold text-[#102F27]">Smart alerts</span>
          </div>
          <span className="rounded-full bg-[#E8F0EE] px-2 py-0.5 text-[10px] font-medium tabular-nums text-[#1A5345]">
            {count}
          </span>
        </div>

        <ul className="max-h-[min(260px,45vh)] divide-y divide-[#E8E6E0] overflow-y-auto">
          {MOCK_ALERTS.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </ul>

        <div className="border-t border-[#E8E6E0] px-3 py-2">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-1 rounded-md py-1 text-[11px] font-medium text-[#6B7870] transition-colors hover:text-[#1A5345]"
          >
            Open full report
            <ArrowRightIcon className="size-3.5" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
