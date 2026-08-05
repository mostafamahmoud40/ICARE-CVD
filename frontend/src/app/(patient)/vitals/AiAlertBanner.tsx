import { AlertTriangleIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AiAlertBannerProps {
  message: string
  className?: string
}

export function AiAlertBanner({ message, className }: AiAlertBannerProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#E8E6E0]/70 bg-white p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon className="size-4 shrink-0 text-rose-600" aria-hidden />
            <h4 className="text-[14px] font-bold text-[#1A1F1E]">Clinical alert</h4>
          </div>
          <p className="text-[13px] font-medium leading-relaxed text-muted-foreground">{message}</p>
        </div>
        <span className="shrink-0 rounded-lg bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
          Alert
        </span>
      </div>
    </div>
  )
}
