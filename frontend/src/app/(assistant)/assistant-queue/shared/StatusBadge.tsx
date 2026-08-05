"use client"

import { cn } from "@/lib/utils"
import type { QueueStatus } from "../assistantQueue.types"
import { STATUS_CONFIG } from "../assistantQueue.config"

export function StatusBadge({ status }: { status: QueueStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-[10px] font-bold shadow-sm",
        cfg.style,
      )}
    >
      {cfg.label}
    </span>
  )
}
