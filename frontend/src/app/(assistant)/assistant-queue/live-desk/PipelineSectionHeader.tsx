"use client"

import { cn } from "@/lib/utils"


export function PipelineSectionHeader({
  icon: Icon,
  iconClass,
  title,
  count,
}: {
  icon: React.ElementType
  iconClass: string
  title: string
  count?: number
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("size-5 stroke-[2.5]", iconClass)} />
      <h3 className="text-[14px] font-bold text-[#1A1F1E]">{title}</h3>
      {count != null && (
        <span className="ml-auto inline-flex items-center justify-center gap-1 overflow-hidden rounded-lg border border-[#E8E6E0]/60 bg-white px-2.5 py-1 text-[11px] font-bold text-[#1A5345] shadow-sm">
          {count} total
        </span>
      )}
    </div>
  )
}

