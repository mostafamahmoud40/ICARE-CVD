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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
    <Card className={cn("col-span-1 border-border/50 shadow-sm", className)}>
      <CardHeader>
        <CardTitle>Heart Rate Progression</CardTitle>
        <CardDescription>
          Your resting heart rate measurements (bpm).
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
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
      </CardContent>
    </Card>
  )
}
