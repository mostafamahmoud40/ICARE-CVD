"use client"

import { Calendar, ClipboardList, FileText, HourglassIcon } from "lucide-react"

import type { ConsultationStats as Stats } from "./consultations.types"

type ConsultationStatsProps = {
  stats: Stats
}

export function ConsultationStats({ stats }: ConsultationStatsProps) {
  const statItems = [
    {
      label: "Total reports",
      value: stats.totalReports,
      icon: FileText,
      iconColor: "text-[#1A5345]",
    },
    {
      label: "This month",
      value: stats.thisMonthReports,
      icon: Calendar,
      iconColor: "text-sky-600",
    },
    {
      label: "Pending report",
      value: stats.pendingReports,
      icon: HourglassIcon,
      iconColor: "text-amber-600",
    },
    {
      label: "Open orders",
      value: stats.followUpDue,
      icon: ClipboardList,
      iconColor: "text-violet-600",
    },
  ]

  return (
    <div className="mt-4 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between gap-3 rounded-lg border border-[#E8E6E0] bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[11px] font-bold uppercase tracking-tight text-[#6B7870]">
              {item.label}
            </span>
            <span className="text-[20px] font-bold leading-none tracking-tight text-[#1A1F1E] tabular-nums">
              {item.value}
            </span>
          </div>
          <item.icon className={`size-5 shrink-0 ${item.iconColor}`} strokeWidth={2} />
        </div>
      ))}
    </div>
  )
}
