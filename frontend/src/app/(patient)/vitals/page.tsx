"use client"

import { useState } from "react"
import {
  ActivityIcon,
  BrainCircuitIcon,
  HeartIcon,
  HeartPulseIcon,
  WeightIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AddVitalsDialog } from "./AddVitalsDialog"
import { AiAlertBanner } from "./AiAlertBanner"
import { AiSummaryBox } from "./AiSummaryBox"
import { VitalKpiCard } from "./VitalKpiCard"
import { BloodPressureChart } from "./BloodPressureChart"
import { HeartRateChart } from "./HeartRateChart"
import { VitalsAiAnalysisSheet, VITALS_AI_ANALYSIS_ITEMS } from "./AiDetailedAnalysis"
import { VitalsHistoryList } from "./VitalsHistoryList"
import { useVitalsFilter, type TimeRange } from "./useVitalsFilter"
import { currentVitals, mockVitalsHistory } from "./vitals.mock"

const timeRangeOptions = [
  { key: "1W" as const, label: "Last week" },
  { key: "1M" as const, label: "Last month" },
  { key: "3M" as const, label: "Last 3 months" },
] as const

function vitalsScrollbarCss() {
  return `
    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--muted-foreground) / 0.15); border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.3); }
  `
}

export default function VitalsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>("3M")

  const suggestedActionCount = VITALS_AI_ANALYSIS_ITEMS.filter((i) => i.action).length

  const filteredData = useVitalsFilter(mockVitalsHistory, timeRange)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsAddModalOpen(false)
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col px-5 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-0.5">
              <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px] lg:text-[26px]">
                Vitals &amp; measurements
              </h1>
              <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">
                AI-assisted trend monitoring and clinical readings for your care plan.
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 pt-1 sm:mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger className="h-10 w-full rounded-2xl border border-[#E8E6E0]/80 bg-[#F9F8F5] text-[13px] font-medium text-[#1A1F1E] shadow-none focus-visible:border-[#1A5345]/50 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#1A5345]/12 sm:h-11 sm:w-[180px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#E8E6E0]">
                {timeRangeOptions.map((option) => (
                  <SelectItem
                    key={option.key}
                    value={option.key}
                    className="cursor-pointer text-[13px] font-medium"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 gap-1.5 rounded-2xl border-0 bg-transparent px-4 text-[12px] font-bold text-[#1A5345] shadow-none hover:bg-transparent sm:h-11"
                onClick={() => setIsAnalysisOpen(true)}
              >
                <BrainCircuitIcon className="size-4" aria-hidden />
                AI analysis
                {suggestedActionCount > 0 ? (
                  <Badge className="ml-0.5 h-5 rounded-md border-0 bg-[#CC5533] px-1.5 text-[10px] font-bold text-white hover:bg-[#CC5533]">
                    {suggestedActionCount}
                  </Badge>
                ) : null}
              </Button>
              <AddVitalsDialog
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        </div>
      </div>

      <VitalsAiAnalysisSheet
        open={isAnalysisOpen}
        onOpenChange={setIsAnalysisOpen}
        items={VITALS_AI_ANALYSIS_ITEMS}
      />

      <div className="relative flex-1 overflow-auto bg-[#F9F8F5] px-6 sm:px-8">
        <div className="custom-scrollbar w-full space-y-6 pb-6 pt-4">
          <div className="flex flex-col gap-4">
            <AiAlertBanner message="Blood pressure on Mar 20 was 158/98 — higher than your usual range. Your care team has been notified." />
            <AiSummaryBox
              title="Last 3 months — trend summary"
              body="Systolic pressure reduced by 18% compared to your history. Heart rate is stable within the safe range for your age and condition."
              actionLabel1="Explain more"
              actionLabel2="Ask about medication"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <VitalKpiCard
              title="Blood pressure"
              icon={<HeartPulseIcon className="size-5" />}
              iconClassName="text-[#1A5345]"
              value={`${currentVitals.bloodPressure.systolic}/${currentVitals.bloodPressure.diastolic}`}
              unit="mmHg"
              trend={currentVitals.bloodPressure.trend}
              trendValue={currentVitals.bloodPressure.trendValue}
              trendGoodDirection="down"
              aiBadgeText="Within your normal range"
              aiBadgeType="info"
            />
            <VitalKpiCard
              title="Heart rate"
              icon={<HeartIcon className="size-5" />}
              iconClassName="text-[#CC5533]"
              value={currentVitals.heartRate.value}
              unit="bpm"
              trend={currentVitals.heartRate.trend}
              trendValue={currentVitals.heartRate.trendValue}
              trendGoodDirection="down"
              aiBadgeText="Stable for your age"
              aiBadgeType="info"
            />
            <VitalKpiCard
              title="Blood oxygen"
              icon={<ActivityIcon className="size-5" />}
              iconClassName="text-emerald-600"
              value={currentVitals.spo2.value}
              unit="%"
              trend={currentVitals.spo2.trend}
              trendValue={currentVitals.spo2.trendValue}
              trendGoodDirection="up"
              aiBadgeText="Excellent"
              aiBadgeType="info"
            />
            <VitalKpiCard
              title="Weight"
              icon={<WeightIcon className="size-5" />}
              iconClassName="text-amber-600"
              value={currentVitals.weight.value}
              unit="kg"
              trend={currentVitals.weight.trend}
              trendValue={currentVitals.weight.trendValue}
              trendGoodDirection="down"
              aiBadgeText="Faster drop than usual"
              aiBadgeType="warning"
            />
          </div>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ActivityIcon className="size-5 text-[#1A5345]" aria-hidden />
                <h3 className="text-[18px] font-bold text-[#1A1F1E]">Vitals trends</h3>
              </div>
              <Badge className="rounded-lg border-0 bg-[#1A5345] px-2.5 py-1 text-[11px] font-bold text-white">
                {timeRange === "1W" ? "Last week" : timeRange === "1M" ? "Last month" : "Last 3 months"}
              </Badge>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
                <div className="border-b border-[#E8E6E0]/60 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-2">
                    <HeartPulseIcon className="size-4 text-[#ef4444]" aria-hidden />
                    <p className="text-[14px] font-bold text-[#1A1F1E]">Blood pressure</p>
                  </div>
                  <p className="mt-0.5 text-[12px] font-medium text-muted-foreground">
                    Systolic and diastolic readings over the selected period.
                  </p>
                </div>
                <BloodPressureChart data={filteredData} className="rounded-none border-0 shadow-none" />
              </div>

              <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
                <div className="border-b border-[#E8E6E0]/60 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-2">
                    <HeartIcon className="size-4 text-[#1A5345]" aria-hidden />
                    <p className="text-[14px] font-bold text-[#1A1F1E]">Heart rate</p>
                  </div>
                  <p className="mt-0.5 text-[12px] font-medium text-muted-foreground">
                    Resting pulse (bpm) on the same date range.
                  </p>
                </div>
                <HeartRateChart data={filteredData} className="rounded-none border-0 shadow-none" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ActivityIcon className="size-5 text-[#1A5345]" aria-hidden />
              <h3 className="text-[18px] font-bold text-[#1A1F1E]">Measurement history</h3>
            </div>
            <VitalsHistoryList data={filteredData} />
          </section>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: vitalsScrollbarCss() }} />
    </div>
  )
}
