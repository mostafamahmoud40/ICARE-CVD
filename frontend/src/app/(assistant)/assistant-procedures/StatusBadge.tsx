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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase sm:text-[11px] shadow-sm",
        cfg.style,
      )}
    >
      <span className={cn("inline-block size-1.5 rounded-full ring-2 ring-white/50", cfg.dot)} />
      {cfg.label}
    </span>
  )
}
