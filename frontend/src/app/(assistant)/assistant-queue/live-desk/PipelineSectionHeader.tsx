"use client"

import { cn } from "@/lib/utils"


export function PipelineSectionHeader({
  icon: Icon,
  iconClass,
  title,
  count,
  countStyle,
}: {
  icon: React.ElementType
  iconClass: string
  title: string
  count?: number
  countStyle?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("size-5", iconClass)} />
      <h3 className="text-[16px] font-bold text-[#1A1F1E]">{title}</h3>
      {count != null && (
        <span className="ml-auto inline-flex items-center justify-center gap-1 overflow-hidden rounded-lg border border-[#E8E6E0] bg-white px-2 py-0.5 text-[11px] font-bold text-[#1A1F1E]">
          {count} total
        </span>
      )}
    </div>
  )
}

