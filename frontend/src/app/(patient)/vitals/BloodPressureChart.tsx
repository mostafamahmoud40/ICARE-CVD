"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import type { VitalHistoryRecord } from "./vitals.mock"

const chartConfig = {
  systolic: {
    label: "Systolic",
    color: "#ef4444",
  },
  diastolic: {
    label: "Diastolic",
    color: "#3b82f6",
  },
} satisfies ChartConfig

const AXIS_TICK = { fill: "#64748b", fontSize: 12, fontWeight: 500 }

export interface BloodPressureChartProps {
  data: VitalHistoryRecord[]
  className?: string
}

export function BloodPressureChart({ data, className }: BloodPressureChartProps) {
  const chartData = React.useMemo(
    () => data.filter((r) => r.systolic !== null && r.diastolic !== null),
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
            domain={["dataMin - 8", "dataMax + 8"]}
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
          <ChartLegend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ paddingBottom: 8, fontSize: 12, fontWeight: 600, color: "#64748b" }}
          />
          <Line
            type="monotone"
            dataKey="systolic"
            name="Systolic"
            stroke="var(--color-systolic)"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "var(--color-systolic)", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="diastolic"
            name="Diastolic"
            stroke="var(--color-diastolic)"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "var(--color-diastolic)", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            connectNulls
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
