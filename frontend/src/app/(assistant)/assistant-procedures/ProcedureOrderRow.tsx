"use client"

import { cn } from "@/lib/utils"
import { CalendarDaysIcon } from "lucide-react"
import { PRIORITY_CONFIG } from "./assistantProcedures.config"
import type { ProcedureOrder } from "./assistantProcedures.types"
import Image from "next/image"

type ProcedureOrderRowProps = {
  order: ProcedureOrder
  isSelected: boolean
  onSelect: () => void
}

export function ProcedureOrderRow({ order, isSelected, onSelect }: ProcedureOrderRowProps) {
  const priority = order.priority
  const pCfg = PRIORITY_CONFIG[priority]

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-all duration-200",
        isSelected
          ? "bg-white shadow-sm ring-1 ring-[#1A5345]/20"
          : "hover:bg-[#EAEBE8]/50"
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="relative size-10 overflow-hidden rounded-full border border-[#E8E6E0] bg-[#F5F5F3]">
          <Image
            src={`https://i.pravatar.cc/150?u=${order.patientId}`}
            alt={order.patientName}
            fill
            className="object-cover"
          />
        </div>
        {priority === "emergency" && (
          <div className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-white bg-red-500 shadow-sm animate-pulse" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn(
              "truncate text-[13px] font-semibold transition-colors",
              isSelected ? "text-[#1A5345]" : "text-[#1A1F1E] group-hover:text-[#1A5345]"
            )}>
              {order.patientName}
            </span>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {order.patientAge}y
            </span>
          </div>
          {order.scheduledAt && (
            <span className="shrink-0 flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
              <CalendarDaysIcon className="size-3" />
              {new Date(order.scheduledAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
        
        <div className="mt-0.5 flex items-center justify-between text-[11px]">
          <span className="truncate font-medium text-muted-foreground">
            {order.procedureName}
          </span>
          {pCfg && priority !== "normal" && (
            <span className={cn(
              "shrink-0 font-bold capitalize",
              priority === "emergency" ? "text-red-600" : "text-[#B8860B]"
            )}>
              {pCfg.label}
            </span>
          )}
        </div>
      </div>
      
      {/* Selected Indicator Bar */}
      {isSelected && (
        <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[#1A5345]" />
      )}
    </button>
  )
}
