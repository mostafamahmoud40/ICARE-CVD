import { ArrowUpRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  green: "bg-emerald-600 dark:bg-emerald-400",
  orange: "bg-amber-600 dark:bg-amber-400",
  blue: "bg-blue-600 dark:bg-blue-400",
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
    <Card className={cn("border-border/50 shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-bold text-[#1A1F1E] dark:text-foreground">
          {title}
        </CardTitle>
        <div className="rounded-full border border-[#C8D9D3] bg-[#E8F0ED] px-2.5 py-0.5 text-[11px] font-semibold text-[#1a5345] dark:border-emerald-900/50 dark:bg-emerald-900/30 dark:text-emerald-400">
          {updatedText}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
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
      </CardContent>
    </Card>
  )
}
