"use client"

import * as React from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import type { VitalHistoryRecord } from "./vitals.mock"

const chartConfig = {
  heartRate: {
    label: "Heart Rate (bpm)",
    color: "#f43f5e",
  },
} satisfies ChartConfig

/**
 * HeartRateChart Component
 * 
 * SOLID Principles:
 * - SRP: Only renders heart rate chart, filtering logic in useMemo
 * - OCP: Accepts className for extension via props
 * - ISP: Props interface only includes what the component needs
 * - DIP: Depends on VitalHistoryRecord abstraction, not concrete implementation
 */
export interface HeartRateChartProps {
  data: VitalHistoryRecord[]
  className?: string
}

export function HeartRateChart({ data, className }: HeartRateChartProps) {
  // SRP: Data filtering logic isolated in useMemo
  const chartData = React.useMemo(
    () => data.filter((r) => r.heartRate !== null),
    [data]
  )

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]", className)}>
      <div className="border-b border-[#E8E6E0]/40 px-5 py-4 sm:px-6">
        <h3 className="font-serif text-[17px] font-bold text-[#1A1F1E]">Heart Rate Progression</h3>
        <p className="mt-1 text-[13px] font-medium text-muted-foreground">
          Your resting heart rate measurements (bpm).
        </p>
      </div>
      <div className="px-5 pb-6 pt-4 sm:px-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border)/0.5)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={["dataMin - 5", "dataMax + 5"]}
            />
            <ChartTooltip
              cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
              content={
                <ChartTooltipContent
                  labelKey="label"
                  indicator="dot"
                />
              }
            />
            <Line
              dataKey="heartRate"
              type="monotone"
              stroke="var(--color-heartRate)"
              strokeWidth={2}
              dot={{ fill: "var(--color-heartRate)", strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  )
}
