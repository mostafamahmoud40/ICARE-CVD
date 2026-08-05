import { type ReactNode } from "react"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export const vitalsSnapshotCardClassName =
  "rounded-xl border border-[#E8E6E0]/60 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"

export interface VitalKpiCardProps {
  title: string
  icon?: ReactNode
  iconClassName?: string
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
  iconClassName = "text-[#1A5345]",
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
        ? "text-emerald-600"
        : "text-rose-600"

  return (
    <div className={cn("space-y-1.5", vitalsSnapshotCardClassName)}>
      <p className="text-[11px] font-medium text-[#6B7870]">{title}</p>
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex min-w-0 items-baseline gap-1">
          <span className="text-[18px] font-bold leading-none tabular-nums text-[#1A1F1E]">
            {value}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">{unit}</span>
        </div>
        {icon ? (
          <span className={cn("shrink-0", iconClassName)} aria-hidden>
            {icon}
          </span>
        ) : null}
      </div>
      <p className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
        {trend !== "stable" ? (
          <TrendIcon className={cn("size-3 shrink-0", trendColorClass)} aria-hidden />
        ) : null}
        <span className={cn("font-bold tabular-nums", trendColorClass)}>{trendValue}</span>
        <span>vs last month</span>
      </p>
      {aiBadgeText ? (
        <p
          className={cn(
            "text-[10px] font-bold",
            aiBadgeType === "warning" ? "text-amber-600" : "text-emerald-600"
          )}
        >
          {aiBadgeText}
        </p>
      ) : null}
    </div>
  )
}
