"use client"

import { cn } from "@/lib/utils"
import { CalendarDaysIcon } from "lucide-react"
import { PRIORITY_CONFIG } from "./assistantProcedures.config"
import type { ProcedureOrder } from "./assistantProcedures.types"

type ProcedureOrderRowProps = {
  order: ProcedureOrder
  isSelected: boolean
  onSelect: () => void
}

export function ProcedureOrderRow({ order, isSelected, onSelect }: ProcedureOrderRowProps) {
  const priority = order.priority
  const pCfg = PRIORITY_CONFIG[priority]

  const dicebearAvatarUrl = (name: string, idFallback: string) => {
    const fromName = typeof name === "string" ? name.trim() : ""
    const fromId = idFallback.trim()
    const raw = (fromName || fromId || "x").replace(/\s+/g, "")
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(raw)}`
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-3 text-left transition-all duration-300",
        isSelected
          ? "border-[#1A5345]/30 bg-white shadow-md shadow-[#1A5345]/5 ring-1 ring-[#1A5345]/10"
          : "border-[#E8E6E0]/60 bg-white hover:border-[#1A5345]/30 hover:bg-[#F9F8F5]/50 hover:shadow-sm",
      )}
    >
      {/* Avatar — circular, matches assistant appointments list */}
      <div className="relative shrink-0">
        <div className={cn(
          "size-10 shrink-0 overflow-hidden rounded-full border-2 transition-all duration-300 sm:size-11",
          isSelected ? "border-[#1A5345]/20 shadow-sm" : "border-[#F4F3ED]"
        )}>
          <img
            src={dicebearAvatarUrl(order.patientName, order.patientId)}
            alt=""
            className="size-full object-cover"
          />
        </div>
        {priority === "emergency" && (
          <div className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-white bg-red-500 shadow-sm animate-pulse" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Name + Age */}
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className={cn(
            "truncate font-serif text-[14px] font-bold tracking-tight transition-colors sm:text-[15px]",
            isSelected ? "text-[#1A5345]" : "text-[#1A1F1E]"
          )}>
            {order.patientName}
          </span>
          <span className="shrink-0 rounded-lg bg-[#F4F3ED] px-1.5 py-0.5 text-[10px] font-bold text-[#6B7870] sm:text-[11px]">
            {order.patientAge}y
          </span>
        </div>

        {/* Procedure Name */}
        <p className={cn(
          "mt-0.5 truncate text-[11px] font-bold transition-colors",
          isSelected ? "text-[#1A5345]/80" : "text-[#1A5345]/60"
        )}>
          {order.procedureName}
        </p>

        {/* Bottom Metadata */}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {pCfg && (
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase",
                pCfg.style,
              )}
            >
              <span className="size-1 rounded-full bg-current opacity-40" />
              {pCfg.label}
            </span>
          )}

          {order.scheduledAt && (
            <span className="inline-flex shrink-0 items-center gap-1 text-[9px] font-bold text-muted-foreground/60 sm:text-[10px]">
              <CalendarDaysIcon className="size-3 shrink-0 text-[#1A5345]/40" />
              {new Date(order.scheduledAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      </div>

      {/* Selected Indicator Bar */}
      {isSelected && (
        <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[#1A5345] shadow-[2px_0_10px_rgba(26,83,69,0.3)]" />
      )}
    </button>
  )
}
