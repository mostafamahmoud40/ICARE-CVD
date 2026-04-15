import { cn } from "@/lib/utils"

export interface AiAlertBannerProps {
  message: string
  className?: string
}

export function AiAlertBanner({ message, className }: AiAlertBannerProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border border-[#D9C4A9] bg-[#F7F1E6] px-4 py-3 text-[#5A4526] shadow-sm dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200",
        className
      )}
    >
      <div className="size-2 shrink-0 rounded-full bg-[#8E7043] dark:bg-amber-500" />
      <p className="m-0 text-[13px] font-medium leading-relaxed">
        {message}
      </p>
    </div>
  )
}
