"use client"

import { cn } from "@/lib/utils"
import { STATUS_CONFIG } from "./assistantProcedures.config"
import type { ProcedureOrderStatus } from "./assistantProcedures.types"

type StatusBadgeProps = {
  status: ProcedureOrderStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium sm:text-[10px]",
        cfg.style,
      )}
    >
      <span className={cn("inline-block size-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  )
}
