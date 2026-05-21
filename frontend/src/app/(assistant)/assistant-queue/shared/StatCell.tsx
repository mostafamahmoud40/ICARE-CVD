"use client"

import { cn } from "@/lib/utils"

export function StatCell({
  icon: Icon,
  value,
  label,
  iconBg,
  iconColor,
}: {
  icon: React.ElementType
  value: number | string
  label: string
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex shrink-0 items-center justify-center">
        <Icon className={cn("size-5", iconColor)} />
      </div>
      <div className="min-w-0">
        <div className="text-[18px] font-bold leading-none text-[#1A1F1E]">{value}</div>
        <div className="mt-0.5 truncate text-[11px] font-medium text-[#6B7870]">{label}</div>
      </div>
    </div>
  )
}
