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
        "flex w-full items-center gap-3 rounded-xl border border-amber-200/60 bg-amber-50 px-4 py-3 text-amber-800 shadow-sm",
        className
      )}
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <AlertTriangleIcon className="size-4" />
      </div>
      <p className="m-0 text-[13px] font-medium leading-relaxed">
        {message}
      </p>
    </div>
  )
}
