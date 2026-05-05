"use client"

import { cn } from "@/lib/utils"
import { UserRoundIcon } from "lucide-react"
import { PRIORITY_CONFIG } from "./assistantProcedures.config"
import type { ProcedureOrder } from "./assistantProcedures.types"

type ProcedureOrderRowProps = {
  order: ProcedureOrder
  isSelected: boolean
  onSelect: () => void
}

export function ProcedureOrderRow({ order, isSelected, onSelect }: ProcedureOrderRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl border-2 p-2.5 text-left transition-all",
        isSelected
          ? "border-[#1A5345]/40 bg-[#F6FBF9] ring-1 ring-[#1A5345]/10"
          : "border-[#E5EEEA] bg-white hover:border-[#A8C4BC]",
      )}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E8F0EE]">
        <UserRoundIcon className="size-4 text-[#1A5345]" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1">
            <span className="truncate text-[11px] font-semibold text-[#102F27]">{order.patientName}</span>
            <span className="shrink-0 text-[9px] text-muted-foreground">{order.patientAge}y</span>
          </div>
          {order.priority !== "normal" && (
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px]",
                PRIORITY_CONFIG[order.priority].style,
              )}
            >
              {PRIORITY_CONFIG[order.priority].dot ? (
                <span
                  className={cn("inline-block size-1.5 shrink-0 rounded-full", PRIORITY_CONFIG[order.priority].dot)}
                  aria-hidden
                />
              ) : null}
              {PRIORITY_CONFIG[order.priority].label}
            </span>
          )}
        </div>
        <div className="mt-0.5 min-w-0">
          <span className="inline-block w-fit max-w-full truncate rounded-full bg-[#EEF5F3] px-1.5 py-0.5 text-[9px] font-medium text-[#2C6A5B]">
            {order.procedureName}
          </span>
        </div>
      </div>
    </button>
  )
}
