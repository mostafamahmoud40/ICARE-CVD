import { ArrowUpRightIcon, SmileIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface AiSummaryBoxProps {
  title: string
  body: string
  actionLabel1?: string
  actionLabel2?: string
  className?: string
}

export function AiSummaryBox({
  title,
  body,
  actionLabel1,
  actionLabel2,
  className,
}: AiSummaryBoxProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-xl border border-[#C8D9D3] bg-[#E8F0ED] p-5 dark:border-emerald-900/50 dark:bg-emerald-950/30",
        className
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/70 shadow-sm text-[#1a5345] dark:bg-emerald-900/50 dark:text-emerald-300">
        <SmileIcon className="size-5" />
      </div>
      <div className="flex flex-col gap-3 w-full">
        <div>
          <h4 className="m-0 mb-1.5 text-[15px] font-semibold text-[#1a5345] dark:text-emerald-300">
            {title}
          </h4>
          <p className="m-0 text-[13px] leading-relaxed text-[#2d4a3e]/90 dark:text-emerald-300/80">
            {body}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {actionLabel1 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-[#C8D9D3] bg-white/70 text-[#1a5345] hover:bg-white/90 hover:text-[#1a5345] dark:border-emerald-900/50 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
            >
              {actionLabel1}
              <ArrowUpRightIcon className="size-3.5" />
            </Button>
          )}
          {actionLabel2 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-[#C8D9D3] bg-white/70 text-[#1a5345] hover:bg-white/90 hover:text-[#1a5345] dark:border-emerald-900/50 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
            >
              {actionLabel2}
              <ArrowUpRightIcon className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
