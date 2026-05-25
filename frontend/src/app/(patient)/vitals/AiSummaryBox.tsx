import { ArrowUpRightIcon, SparklesIcon } from "lucide-react"
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
        "flex items-start gap-4 rounded-2xl border border-violet-200/60 bg-violet-50/50 p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]",
        className
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm text-violet-600">
        <SparklesIcon className="size-5" />
      </div>
      <div className="flex flex-col gap-3 w-full">
        <div>
          <h4 className="m-0 mb-1.5 font-serif text-[16px] font-bold text-[#1A1F1E]">
            {title}
          </h4>
          <p className="m-0 text-[13px] font-medium leading-relaxed text-muted-foreground">
            {body}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actionLabel1 && (
            <Button
              variant="outline"
              size="sm"
              className="group h-8 gap-1.5 rounded-lg border-violet-200 bg-white px-3 text-[12px] font-bold text-violet-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 hover:shadow-md"
            >
              {actionLabel1}
              <ArrowUpRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
          )}
          {actionLabel2 && (
            <Button
              variant="outline"
              size="sm"
              className="group h-8 gap-1.5 rounded-lg border-violet-200 bg-white px-3 text-[12px] font-bold text-violet-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 hover:shadow-md"
            >
              {actionLabel2}
              <ArrowUpRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
