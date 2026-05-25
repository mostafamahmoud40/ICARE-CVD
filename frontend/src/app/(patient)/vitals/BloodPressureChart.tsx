"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

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
    label: "Systolic (mmHg)",
    color: "#1a5345",
  },
  diastolic: {
    label: "Diastolic (mmHg)",
    color: "#e89042",
  },
} satisfies ChartConfig

/**
 * BloodPressureChart Component
 * 
 * SOLID Principles:
 * - SRP: Only renders blood pressure chart, filtering logic in useMemo
 * - OCP: Accepts className for extension via props
 * - ISP: Props interface only includes what the component needs
 * - DIP: Depends on VitalHistoryRecord abstraction, not concrete implementation
 */
export interface BloodPressureChartProps {
  data: VitalHistoryRecord[]
  className?: string
}

interface InteractiveLegendContentProps {
  activeSeries: string[]
  onToggle: (dataKey: string) => void
}

/**
 * InteractiveLegendContent - Internal component following SRP
 * Only responsible for rendering clickable legend items
 */
function InteractiveLegendContent({ activeSeries, onToggle }: InteractiveLegendContentProps) {
  return (
    <div className="flex items-center justify-center gap-4 pt-3">
      {Object.entries(chartConfig).map(([key, config]) => {
        const isActive = activeSeries.includes(key)
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={`flex items-center gap-1.5 transition-opacity ${
              isActive ? "opacity-100" : "opacity-50"
            }`}
          >
            <div
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: config.color }}
            />
            <span className="text-xs text-muted-foreground">{config.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function BloodPressureChart({ data, className }: BloodPressureChartProps) {
  const [activeSeries, setActiveSeries] = React.useState<string[]>([
    "systolic",
    "diastolic",
  ])

  // SRP: Data filtering logic isolated in useMemo
  const chartData = React.useMemo(
    () => data.filter((r) => r.systolic !== null && r.diastolic !== null),
    [data]
  )

  const toggleSeries = (dataKey: string) => {
    setActiveSeries((prev) =>
      prev.includes(dataKey)
        ? prev.filter((key) => key !== dataKey)
        : [...prev, dataKey]
    )
  }

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]", className)}>
      <div className="border-b border-[#E8E6E0]/40 px-5 py-4 sm:px-6">
        <h3 className="font-serif text-[17px] font-bold text-[#1A1F1E]">Blood Pressure Trend</h3>
        <p className="mt-1 text-[13px] font-medium text-muted-foreground">
          Progression of your Systolic and Diastolic readings over time.
        </p>
      </div>
      <div className="px-5 pb-6 pt-4 sm:px-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="fillSystolic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-systolic)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-systolic)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillDiastolic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-diastolic)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-diastolic)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
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
              domain={["dataMin - 10", "dataMax + 10"]}
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
            <ChartLegend
              content={
                <InteractiveLegendContent
                  activeSeries={activeSeries}
                  onToggle={toggleSeries}
                />
              }
            />
            <Area
              dataKey="systolic"
              type="monotone"
              stroke="var(--color-systolic)"
              strokeWidth={2}
              fill="url(#fillSystolic)"
              hide={!activeSeries.includes("systolic")}
              dot={{ fill: "var(--color-systolic)", strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
            <Area
              dataKey="diastolic"
              type="monotone"
              stroke="var(--color-diastolic)"
              strokeWidth={2}
              fill="url(#fillDiastolic)"
              hide={!activeSeries.includes("diastolic")}
              dot={{ fill: "var(--color-diastolic)", strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  )
}
