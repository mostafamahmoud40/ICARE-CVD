import { ArrowUpRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type AiAnalysisColor = "green" | "orange" | "blue"

export interface AiAnalysisItem {
  color: AiAnalysisColor
  title: string
  description: string
}

export interface AiDetailedAnalysisProps {
  title: string
  updatedText: string
  items: AiAnalysisItem[]
  actionLabel1?: string
  actionLabel2?: string
  className?: string
}

const colorMap = {
  green: "bg-emerald-500",
  orange: "bg-amber-500",
  blue: "bg-blue-500",
}

export function AiDetailedAnalysis({
  title,
  updatedText,
  items,
  actionLabel1,
  actionLabel2,
  className,
}: AiDetailedAnalysisProps) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]", className)}>
      <div className="flex flex-row items-center justify-between border-b border-[#E8E6E0]/40 px-5 py-4 sm:px-6">
        <h3 className="font-serif text-[17px] font-bold text-[#1A1F1E]">
          {title}
        </h3>
        <div className="inline-flex shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-lg bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
          {updatedText}
        </div>
      </div>
      <div className="flex flex-col gap-4 px-5 pb-6 pt-4 sm:px-6">
        <ul className="flex flex-col gap-3">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-1.5 size-1.5 shrink-0 rounded-full",
                  colorMap[item.color]
                )}
              />
              <p className="m-0 text-[13px] leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {item.title}:
                </span>{" "}
                {item.description}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          {actionLabel1 && (
            <Button
              variant="outline"
              className="h-9 gap-1.5 rounded-lg text-[13px]"
            >
              {actionLabel1}
              <ArrowUpRightIcon className="size-3.5 text-muted-foreground" />
            </Button>
          )}
          {actionLabel2 && (
            <Button
              variant="outline"
              className="h-9 gap-1.5 rounded-lg text-[13px]"
            >
              {actionLabel2}
              <ArrowUpRightIcon className="size-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
