"use client"

import { cn } from "@/lib/utils"
import type { QueueStatus } from "../assistantQueue.types"
import { STATUS_CONFIG } from "../assistantQueue.config"

export function StatusBadge({ status }: { status: QueueStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-medium sm:text-[10px]",
        cfg.style,
      )}
    >
      <span className={cn("inline-block size-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  )
}
