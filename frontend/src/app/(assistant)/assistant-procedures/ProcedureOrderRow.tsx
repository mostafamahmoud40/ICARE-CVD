"use client"

import { cn } from "@/lib/utils"
import { UserRoundIcon, CalendarDaysIcon } from "lucide-react"
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

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-3 text-left transition-all sm:p-4",
        isSelected
          ? "border-[#1A5345]/30 bg-[#F6FBF9] shadow-sm"
          : "border-[#E5EEEA] bg-white hover:border-[#A8C4BC] hover:shadow-sm",
      )}
    >
      {/* Clean avatar */}
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E8F0EE]">
        <UserRoundIcon className="size-5 text-[#1A5345]" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Name + procedure */}
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold text-[#102F27]">{order.patientName}</span>
          <span className="shrink-0 text-[10px] text-[#9CA3AF]">{order.patientAge}y</span>
        </div>

        {/* Bottom: procedure + priority + date */}
        <div className="mt-0.5 flex items-center gap-2">
          <span className="truncate text-[10px] font-medium text-[#4F6D64]">{order.procedureName}</span>

          {priority !== "normal" && pCfg && (
            <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0 text-[9px] font-medium", pCfg.style)}>
              {pCfg.dot && <span className={cn("size-1 rounded-full", pCfg.dot)} />}
              {pCfg.label}
            </span>
          )}

          {order.scheduledAt && (
            <span className="inline-flex shrink-0 items-center gap-1 text-[9px] text-[#9CA3AF]">
              <CalendarDaysIcon className="size-3" />
              {new Date(order.scheduledAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
