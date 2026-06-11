import { ArrowRightIcon, SparklesIcon } from "lucide-react"
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
        "rounded-2xl border border-[#E8E6E0]/70 bg-white p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <SparklesIcon className="mt-0.5 size-5 shrink-0 text-[#1A5345]" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h4 className="text-[14px] font-bold text-[#1A1F1E]">{title}</h4>
            <p className="mt-1 text-[13px] font-medium leading-relaxed text-muted-foreground">
              {body}
            </p>
          </div>
          {(actionLabel1 || actionLabel2) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {actionLabel1 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg border-[#E8E6E0] bg-white px-3 text-[12px] font-bold text-[#1A5345] hover:bg-[#F9F8F5] shadow-sm"
                >
                  {actionLabel1}
                  <ArrowRightIcon className="ml-1.5 size-3.5" aria-hidden />
                </Button>
              ) : null}
              {actionLabel2 ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-8 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white hover:bg-[#133F34] shadow-sm"
                >
                  {actionLabel2}
                  <ArrowRightIcon className="ml-1.5 size-3.5" aria-hidden />
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
