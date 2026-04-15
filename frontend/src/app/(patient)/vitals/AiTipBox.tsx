import { SparklesIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AiTipBoxProps {
  title: string
  body: string
  className?: string
}

export function AiTipBox({ title, body, className }: AiTipBoxProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-xl border border-[#A8C4BC] bg-[#E8F0EE] p-4 dark:border-emerald-800 dark:bg-emerald-950/30",
        className
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white dark:bg-emerald-900/50 shadow-sm text-[#C5A97B] dark:text-amber-400">
        <SparklesIcon className="size-5" />
      </div>
      <div>
        <h4 className="m-0 mb-1 text-[13px] font-semibold text-[#00392D] dark:text-emerald-300">
          {title}
        </h4>
        <p className="m-0 text-[12px] leading-relaxed text-[#00392D]/85 dark:text-emerald-300/80">
          {body}
        </p>
      </div>
    </div>
  )
}
