"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

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
    label: "Heart rate",
    color: "#1A5345",
  },
} satisfies ChartConfig

const AXIS_TICK = { fill: "#64748b", fontSize: 12, fontWeight: 500 }

export interface HeartRateChartProps {
  data: VitalHistoryRecord[]
  className?: string
}

export function HeartRateChart({ data, className }: HeartRateChartProps) {
  const chartData = React.useMemo(
    () => data.filter((r) => r.heartRate !== null),
    [data]
  )

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]",
        className
      )}
    >
      <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full px-2 pb-2 pt-2 lg:h-[300px]">
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E6E0" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={AXIS_TICK}
            dy={10}
            minTickGap={28}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={AXIS_TICK}
            domain={["dataMin - 5", "dataMax + 5"]}
            width={36}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelKey="label"
                indicator="dot"
                className="rounded-xl border-[#E8E6E0] shadow-md"
              />
            }
          />
          <Line
            type="monotone"
            dataKey="heartRate"
            name="Heart rate"
            stroke="var(--color-heartRate)"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "var(--color-heartRate)", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            connectNulls
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
