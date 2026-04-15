import { type ReactNode } from "react"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface VitalKpiCardProps {
  title: string
  icon: ReactNode
  iconContainerClass?: string
  value: ReactNode
  unit: string
  trend: "up" | "down" | "stable"
  trendValue: string
  trendGoodDirection: "up" | "down" | "none"
  aiBadgeText?: string
  aiBadgeType?: "info" | "warning"
}

export function VitalKpiCard({
  title,
  icon,
  iconContainerClass,
  value,
  unit,
  trend,
  trendValue,
  trendGoodDirection,
  aiBadgeText,
  aiBadgeType = "info",
}: VitalKpiCardProps) {
  const isGoodTrend = trend === trendGoodDirection
  const TrendIcon = trend === "down" ? TrendingDownIcon : TrendingUpIcon
  const trendColorClass =
    trend === "stable" || trendGoodDirection === "none"
      ? "text-muted-foreground"
      : isGoodTrend
        ? "text-emerald-500"
        : "text-red-500"

  return (
    <Card className="transition-colors hover:border-primary/50 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-full ring-1 ring-black/5 dark:ring-white/10",
            iconContainerClass
          )}
        >
          {icon}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        <div className="text-2xl font-bold">
          {value}{" "}
          <span className="text-sm font-normal tracking-normal text-muted-foreground">
            {unit}
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          {trend !== "stable" && <TrendIcon className={cn("size-3", trendColorClass)} />}
          <span className={cn("font-medium", trendColorClass)}>
            {trendValue}
          </span>{" "}
          since last month
        </p>

        {aiBadgeText && (
          <div className="mt-auto pt-4">
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                aiBadgeType === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/30 dark:text-amber-400"
                  : "border-[#C8D9D3] bg-[#E8F0ED] text-[#1a5345] dark:border-emerald-900/50 dark:bg-emerald-900/30 dark:text-emerald-400"
              )}
            >
              <div
                className={cn(
                  "size-1.5 rounded-full",
                  aiBadgeType === "warning" ? "bg-amber-600 dark:bg-amber-400" : "bg-[#1a5345] dark:bg-emerald-400"
                )}
              />
              {aiBadgeText}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

