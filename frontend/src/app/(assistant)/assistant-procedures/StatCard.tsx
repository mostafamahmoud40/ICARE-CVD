"use client"

import { cn } from "@/lib/utils"

type StatCardProps = {
  icon: React.ElementType
  iconStyle: string
  value: number | string
  label: string
}

export function StatCard({ icon: Icon, iconStyle, value, label }: StatCardProps) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[#E5EEEA] bg-[#FBFDFC] px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
      <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg sm:size-9", iconStyle)}>
        <Icon className="size-3.5 sm:size-4" />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-bold text-[#102F27] sm:text-xl">{value}</div>
        <div className="text-[10px] text-muted-foreground sm:text-[11px]">{label}</div>
      </div>
    </div>
  )
}
