"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { STATUS_CONFIG } from "./assistantProcedures.config"
import type { ProcedureOrderStatus } from "./assistantProcedures.types"

type StatusBadgeProps = {
  status: ProcedureOrderStatus
}

/** Solid chips — same pattern as medications `RiskBadge`. */
const STATUS_BADGE_CLASS: Record<ProcedureOrderStatus, string> = {
  pending: "border-0 bg-amber-500 text-white hover:bg-amber-500",
  "in-progress": "border-0 bg-[#1A5345] text-white hover:bg-[#1A5345]",
  completed: "border-0 bg-emerald-500 text-white hover:bg-emerald-500",
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge
      variant="default"
      className={cn(
        "rounded-lg px-2 py-0.5 text-[10px] font-bold leading-none shadow-none",
        STATUS_BADGE_CLASS[status],
      )}
    >
      {STATUS_CONFIG[status].label}
    </Badge>
  )
}
